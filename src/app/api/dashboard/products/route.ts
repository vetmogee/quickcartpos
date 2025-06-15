import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  price: z.number(),
  amountType: z.enum(['KS', 'KG']),
  productTypeId: z.number().int().positive('Product type ID is required'),
});

export async function GET(request: NextRequest) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const barcode = searchParams.get('barcode');
  const productTypeIdsParam = searchParams.get('productTypeIds');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const where: Prisma.ProductWhereInput = { userId };

  // Handle name and barcode search
  if (name || barcode) {
    where.OR = [];
    if (name) {
      where.OR.push({ name: { contains: name, mode: 'insensitive' } });
    }
    if (barcode) {
      where.OR.push({ barcode: { contains: barcode, mode: 'insensitive' } });
    }
  }

  // Handle product type filter
  if (productTypeIdsParam) {
    const ids = productTypeIdsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    if (ids.length > 0) {
      where.productTypeId = { in: ids };
    }
  }
  
  // Handle price range filter
  const priceFilter: Prisma.FloatFilter = {};
  if (minPrice) {
    const minP = parseFloat(minPrice);
    if (!isNaN(minP)) {
      priceFilter.gte = minP;
    }
  }
  if (maxPrice) {
    const maxP = parseFloat(maxPrice);
    if (!isNaN(maxP)) {
      priceFilter.lte = maxP;
    }
  }
  if (Object.keys(priceFilter).length > 0) {
    where.price = priceFilter;
  }

  try {
    const totalItems = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        productType: {
          include: {
            vat: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return NextResponse.json({
      data: products,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    // Check if error is a Prisma specific error for more detailed messages if needed
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Example: P2021: Table does not exist
        // Example: P2025: Record not found
        return NextResponse.json({ error: `Failed to fetch products. Prisma error: ${error.code}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const { name, barcode, price, amountType, productTypeId } = validation.data;

    // Check for barcode uniqueness for this user
    const existingProductByBarcode = await prisma.product.findUnique({
      where: { userId_barcode: { userId, barcode } },
    });

    if (existingProductByBarcode) {
      return NextResponse.json({ error: 'Product with this barcode already exists for this user' }, { status: 409 });
    }
    
    // Check if product type exists (it should, as they are global)
    const productTypeExists = await prisma.productType.findUnique({
        where: { id: productTypeId }
    });

    if (!productTypeExists) {
        return NextResponse.json({ error: 'Selected Product Type does not exist.'}, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        barcode,
        price,
        amountType,
        productTypeId,
        userId,
      },
      include: {
        productType: { // Include productType to match GET response structure
            include: {
                vat: true
            }
        }
      }
    });
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle potential Prisma errors, e.g., foreign key constraint
        if (error.code === 'P2002') { // Unique constraint violation (though barcode uniqueness is checked above)
             return NextResponse.json({ error: 'Failed to create product due to a conflict. Please check your input.' }, { status: 409 });
        }
        if (error.code === 'P2003') { // Foreign key constraint failed (e.g. productTypeId not valid)
            return NextResponse.json({ error: 'Invalid Product Type selected.' }, { status: 400 });
        }
        return NextResponse.json({ error: `Failed to create product. Prisma error: ${error.code}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
} 