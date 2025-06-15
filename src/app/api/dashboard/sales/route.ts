import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Prisma } from '@/generated/prisma';

export async function GET(request: NextRequest) {
  const verification = await verifyAuth(request);
  if (!verification.user || !verification.user.userId) {
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

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  endDate.setHours(23, 59, 59, 999); // Ensure endDate includes the entire day

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        orderDate: true,
        total: true,
      },
    });

    const salesByDay: Record<string, number> = {};
    orders.forEach(order => {
      const day = order.orderDate.toISOString().split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + order.total;
    });
    
    // Convert to array for sorting and pagination
    const dailySalesArray = Object.entries(salesByDay)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending

    const totalItems = dailySalesArray.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedData = dailySalesArray.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
        data: paginatedData, // This is now an array of {date, total}
        pagination: {
            totalItems,
            totalPages,
            currentPage: page,
            pageSize
        }
    });

  } catch (error) {
    console.error("Error fetching sales data:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return NextResponse.json({ error: `Failed to fetch sales data. Prisma error: ${error.code}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
  }
} 