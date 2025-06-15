import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma';

const fastMenuItemSchema = z.object({
  productId: z.number().int().positive(),
  productTypeId: z.number().int().positive(),
  displayOrder: z.number().int().optional(),
});

export async function GET(request: NextRequest) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);

  const { searchParams } = new URL(request.url);
  const productTypeIdStr = searchParams.get('productTypeId');
  let productTypeId: number | undefined = undefined;

  if (productTypeIdStr) {
    productTypeId = parseInt(productTypeIdStr, 10);
    if (isNaN(productTypeId)) {
      return NextResponse.json({ error: 'Invalid productTypeId parameter' }, { status: 400 });
    }
  }

  try {
    const fastMenuItems = await prisma.fastMenuItem.findMany({
      where: {
        userId: userId,
        ...(productTypeId && { productTypeId: productTypeId }),
      },
      include: {
        product: {
          include: {
            productType: {
              include: {
                vat: true,
              },
            },
          },
        },
        productType: true, // Include the direct product type of the fast menu item itself
      },
      orderBy: {
        displayOrder: 'asc', // Default order
      },
    });
    return NextResponse.json(fastMenuItems);
  } catch (error) {
    console.error('Error fetching fast menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch fast menu items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);

  let data;
  try {
    const jsonData = await request.json();
    data = fastMenuItemSchema.parse(jsonData);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body', details: (error as z.ZodError).errors }, { status: 400 });
  }

  try {
    // Check if the product belongs to the user
    const product = await prisma.product.findUnique({
      where: { id: data.productId, userId: userId },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found or does not belong to the user' }, { status: 404 });
    }

    // Check if the product type exists (globally)
    const productType = await prisma.productType.findUnique({
        where: { id: data.productTypeId }
    });
    if (!productType) {
        return NextResponse.json({ error: 'ProductType not found' }, { status: 404 });
    }

    // Optional: If displayOrder is not provided, set it to be the last one
    if (data.displayOrder === undefined) {
        const maxDisplayOrder = await prisma.fastMenuItem.aggregate({
            _max: { displayOrder: true },
            where: { userId: userId, productTypeId: data.productTypeId },
        });
        data.displayOrder = (maxDisplayOrder._max.displayOrder ?? -1) + 1;
    }

    const newFastMenuItem = await prisma.fastMenuItem.create({
      data: {
        userId: userId,
        productId: data.productId,
        productTypeId: data.productTypeId,
        displayOrder: data.displayOrder,
      },
      include: {
        product: true,
        productType: true,
      }
    });
    return NextResponse.json(newFastMenuItem, { status: 201 });
  } catch (error) {
    console.error('Error creating fast menu item:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { 
        return NextResponse.json({ error: 'This product is already in the fast menu for this product type.' }, { status: 409 });
    } else if (error instanceof Error) {
        return NextResponse.json({ error: `Failed to create fast menu item: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create fast menu item due to an unknown error.' }, { status: 500 });
  }
} 