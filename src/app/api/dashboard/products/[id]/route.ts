import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';
import { Prisma, AmountType } from '@/generated/prisma'; // Import AmountType enum

const productUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  barcode: z.string().min(1, "Barcode is required").optional(),
  price: z.number().optional(),
  amountType: z.nativeEnum(AmountType).optional(),
  productTypeId: z.number().int().positive("Product type is required").optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);
  const productId = parseInt(params.id, 10);

  if (isNaN(userId) || isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid user or product ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const validation = productUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.format() }, { status: 400 });
    }

    const dataToUpdate = validation.data;

    // If barcode is being updated, check for conflicts (excluding the current product)
    if (dataToUpdate.barcode) {
        const existingProduct = await prisma.product.findUnique({
            where: {
                userId_barcode: { userId: userId, barcode: dataToUpdate.barcode },
            }
        });
        // Check if the found product is not the one being updated
        if (existingProduct && existingProduct.id !== productId) {
            return NextResponse.json({ error: 'Another product with this barcode already exists' }, { status: 409 });
        }
    }

    const updateResult = await prisma.product.updateMany({
      where: {
        id: productId,
        userId: userId, // Ensure user owns the product
      },
      data: dataToUpdate,
    });

     if (updateResult.count === 0) {
         return NextResponse.json({ error: 'Product not found or user does not have permission to update' }, { status: 404 });
     }

     // Fetch the updated product with its type to return
     const updatedProduct = await prisma.product.findFirst({
         where: { id: productId, userId: userId },
         include: { productType: true } // Include the product type
     });

    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error("Error updating product:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') { // Unique constraint violation (barcode)
       return NextResponse.json({ error: 'Update failed: A product with this barcode already exists for your account.' }, { status: 409 });
     }
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') { // Foreign key constraint (productTypeId)
         return NextResponse.json({ error: 'Update failed: Invalid product type specified.' }, { status: 400 });
     }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);
  const productId = parseInt(params.id, 10);

  if (isNaN(userId) || isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid user or product ID' }, { status: 400 });
  }

  try {
    // Check if product exists and belongs to user before deleting
    const product = await prisma.product.findFirst({
        where: { id: productId, userId: userId },
        select: { id: true } // Only need to check existence
    });

    if (!product) {
        return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    // Perform deletion (database constraints should handle OrderItem relations if set up correctly)
    // Consider if you need to manually check for OrderItems if constraints aren't set
    await prisma.product.delete({
      where: {
        id: productId,
        userId: userId // Extra safety check
      },
    });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error("Error deleting product:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2014') {
         // Relation violation - e.g., product is part of an OrderItem
         // Note: Your schema uses onDelete: Cascade for Order -> OrderItem, but not Product -> OrderItem
         return NextResponse.json({ error: 'Cannot delete product as it is part of existing orders' }, { status: 409 });
     }
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 