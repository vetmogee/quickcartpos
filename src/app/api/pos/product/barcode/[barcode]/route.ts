import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@/generated/prisma';

interface GETParams {
  params: {
    barcode: string;
  };
}

export async function GET(request: NextRequest, { params }: GETParams) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const { barcode } = await params;

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode parameter is required' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        userId_barcode: {
          userId: userId,
          barcode: barcode,
        },
      },
      include: {
        productType: {
          include: {
            vat: true, // Include VAT details from ProductType
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(`Error fetching product by barcode ${barcode}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `Failed to fetch product. Prisma error: ${error.code}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
} 