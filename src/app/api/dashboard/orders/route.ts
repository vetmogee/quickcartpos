import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@/generated/prisma';

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
  const startDateString = searchParams.get('startDate');
  const endDateString = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  if (!startDateString || !endDateString) {
    return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
  }

  // Create dates and adjust for timezone
  const startDate = new Date(startDateString);
  startDate.setDate(startDate.getDate()); 
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(endDateString);
  endDate.setDate(endDate.getDate()+1 ); 
  endDate.setHours(0, 0, 0, 0);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  try {
    const whereClause: Prisma.OrderWhereInput = {
      userId,
      orderDate: {
        gte: startDate,
        lte: endDate,
      }
    };

    const totalItems = await prisma.order.count({ where: whereClause });

    const orders = await prisma.order.findMany({
      where: whereClause,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        orderItems: {
          include: {
            product: {
              select: { name: true, amountType: true },
            },
          },
        },
        user: {
          select: { id: true, ico: true, fname: true, sname: true, email: true }
        }
      },
      orderBy: [{ orderDate: 'desc' }],
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    return NextResponse.json({
      data: orders,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ error: `Failed to fetch orders. Prisma error: ${error.code}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
} 