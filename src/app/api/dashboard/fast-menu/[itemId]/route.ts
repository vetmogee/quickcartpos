import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

interface DELETEParams {
  params: {
    itemId: string;
  };
}

export async function DELETE(request: NextRequest, { params }: DELETEParams) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);

  const itemId = parseInt(params.itemId, 10);
  if (isNaN(itemId)) {
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
  }

  try {
    // First, verify the item belongs to the user before deleting
    const itemToDelete = await prisma.fastMenuItem.findUnique({
      where: { id: itemId },
    });

    if (!itemToDelete) {
      return NextResponse.json({ error: 'Fast menu item not found' }, { status: 404 });
    }

    if (itemToDelete.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You do not own this item' }, { status: 403 });
    }

    await prisma.fastMenuItem.delete({
      where: {
        id: itemId,
        // No need to check userId again here as we did it above, but can be added for extra safety
        // userId: userId, 
      },
    });

    return NextResponse.json({ message: 'Fast menu item deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting fast menu item ${itemId}:`, error);
    return NextResponse.json({ error: 'Failed to delete fast menu item' }, { status: 500 });
  }
} 