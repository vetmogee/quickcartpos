import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// verifyAuth is not needed here anymore as types are global
// import { z } from 'zod'; // z is not used anymore
// import { Prisma } from '@/generated/prisma'; // Prisma namespace not used directly

// POST handler schema is removed as POST is removed
// const productTypeSchema = z.object({ ... });

export async function GET() {
  // No user authentication/verification needed to fetch global product types
  // const verification = await verifyAuth(request);
  // if (!verification.user) {
  //   return NextResponse.json({ error: verification.error || 'Authentication required' }, { status: 401 });
  // }
  // const userId = parseInt(verification.user.userId, 10);
  // if (isNaN(userId)) {
  //   return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  // }

  try {
    const productTypes = await prisma.productType.findMany({
      // No where clause for userId, fetch all
      include: {
        vat: true, // Include the related VAT information
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(productTypes);
  } catch (error) {
    console.error("Error fetching product types:", error);
    return NextResponse.json({ error: 'Failed to fetch product types' }, { status: 500 });
  }
}

// POST function is removed as product types are now fixed and managed globally.
// export async function POST(request: NextRequest) { ... } 