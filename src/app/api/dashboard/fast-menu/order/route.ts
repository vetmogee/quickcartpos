import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const orderUpdateSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    displayOrder: z.number().int().min(0),
  })
);

export async function PUT(request: NextRequest) {
  const verification = await verifyAuth(request);
  if (!verification.user) {
    return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  }
  const userId = parseInt(verification.user.userId, 10);

  let updates;
  try {
    const jsonData = await request.json();
    updates = orderUpdateSchema.parse(jsonData);
    if (updates.length === 0) {
        return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body', details: (error as z.ZodError).errors }, { status: 400 });
  }

  try {
    // Verify all items belong to the user
    const itemIds = updates.map(u => u.id);
    const itemsToUpdate = await prisma.fastMenuItem.findMany({
      where: {
        id: { in: itemIds },
        userId: userId, // Crucial check
      },
    });

    if (itemsToUpdate.length !== itemIds.length) {
      return NextResponse.json({ error: 'One or more items not found or do not belong to the user' }, { status: 403 });
    }
    
    // Perform updates in a transaction
    const transactionOperations = updates.map(update => 
      prisma.fastMenuItem.update({
        where: {
          id: update.id,
          // userId: userId, // Already verified, but can be added for extra safety
        },
        data: {
          displayOrder: update.displayOrder,
        },
      })
    );

    await prisma.$transaction(transactionOperations);

    return NextResponse.json({ message: 'Fast menu items reordered successfully' });

  } catch (error) {
    console.error('Error reordering fast menu items:', error);
    return NextResponse.json({ error: 'Failed to reorder fast menu items' }, { status: 500 });
  }
} 