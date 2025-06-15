"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format as formatDate, parseISO, subDays } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { AmountType } from '@/generated/prisma'; // Assuming this type is still needed from prisma
import { Button } from "@/components/ui/button";
import { OrderDetailModal } from './OrderDetailModal'; // Import the modal
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';

// Interface Definitions (moved from main page or defined as needed)
interface OrderItemProductData {
    name: string;
    amountType: AmountType;
}
interface OrderItemData {
  productId: string; 
  orderId: string;
  quantity: number;
  priceAtTime: number;
  dphAtTime: number;
  product: OrderItemProductData;
}

interface OrderData {
  id: string; 
  orderDate: string;
  total: number;
  dphTotal: number | null;
  subTotal: number | null;
  paidAmount: number;
  returnAmount: number;
  userId: string;
  orderItems: OrderItemData[];
}

interface OrdersTabProps {
  isActive: boolean;
}

export function OrdersTab({ isActive }: OrdersTabProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Pagination State (New) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Helper to format date and time (simplified)
  const formatOrderDateTime = (orderDateISO: string): string => {
      try {
          const dateTime = parseISO(orderDateISO); // Directly parse the ISO string
          if (isNaN(dateTime.getTime())) {
              return `${orderDateISO} (neplatné datum)`;
          }
          return formatDate(dateTime, 'P, HH:mm:ss', { locale: cs });
      } catch (e) {
          console.error("Error formatting order date/time:", e, {orderDateISO});
          return `${orderDateISO} (chyba formátování)`;
      }
  };

  useEffect(() => {
    if (isActive && dateRange?.from && dateRange?.to) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        setOrdersError(null);

        const startDate = dateRange.from!.toISOString().split('T')[0];
        const endDate = dateRange.to!.toISOString().split('T')[0];
        
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        queryParams.append('page', currentPage.toString());
        queryParams.append('pageSize', pageSize.toString());
        const queryString = queryParams.toString();

        try {
          const response = await fetch(`/api/dashboard/orders?${queryString}`);
          const result = await response.json();
          if (!response.ok) {
            const errorMessage = result.error || `HTTP error! status: ${response.status}`;
             if (response.status === 401) {
                router.push('/login?error=session_expired');
                return;
             }
            throw new Error(errorMessage);
          }
          if (result && Array.isArray(result.data) && result.pagination) {
            setOrders(result.data);
            setTotalItems(result.pagination.totalItems);
            setTotalPages(result.pagination.totalPages);
            setCurrentPage(result.pagination.currentPage);
            setPageSize(result.pagination.pageSize);
          } else {
            throw new Error('Invalid orders data format from API.');
          }
        } catch (err) {
          console.error("Failed to fetch order history:", err);
          setOrdersError(err instanceof Error ? err.message : "Error fetching order history");
          setOrders([]); // Clear on error
          setTotalItems(0); // Reset pagination on error
          setTotalPages(0);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [isActive, router, currentPage, pageSize, dateRange]); // Added dateRange dependency

  // Reset to page 1 when dateRange changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange]);

  // --- Modal Handlers ---
  const handleOrderItemClick = (order: OrderData) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // --- Pagination Handlers (New) ---
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historie objednávek</CardTitle>
        <CardDescription>Zobrazit minulé objednávky.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        {loadingOrders && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Načítání objednávek...</span>
          </div>
        )}
        {ordersError && (
          <div className="text-red-600 bg-red-100 border border-red-400 p-3 rounded-md">
            Chyba: {ordersError}
          </div>
        )}
        {!loadingOrders && !ordersError && (
          orders.length > 0 ? (
            <ScrollArea className="h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Datum a čas</TableHead>
                    <TableHead>Položky</TableHead>
                    <TableHead className="text-right">Celkem</TableHead>
                    <TableHead className="text-right">Zaplaceno</TableHead>
                    <TableHead className="text-right">Vráceno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow 
                      key={order.id} 
                      onClick={() => handleOrderItemClick(order)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      <TableCell>{formatOrderDateTime(order.orderDate)}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-sm">
                          {order.orderItems.map((item, index) => (
                            <li key={`${item.productId}-${index}-${item.orderId}`}> {/* Ensure more unique key */}
                              {item.quantity} {item.product.amountType === 'KG' ? 'kg' : 'x'} {item.product.name} (@ {item.priceAtTime.toFixed(2)})
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-right">{order.total.toFixed(2)} Kč</TableCell>
                      <TableCell className="text-right">{order.paidAmount.toFixed(2)} Kč</TableCell>
                      <TableCell className="text-right">{order.returnAmount.toFixed(2)} Kč</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-gray-500">Nebyly nalezeny žádné objednávky.</p>
          )
        )}
        {/* Pagination Controls - New */}
        {!loadingOrders && totalItems > 0 && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Button // Using Button from @/components/ui/button (should be imported)
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
            >
              Předchozí
            </Button>
            <span className="text-sm text-muted-foreground">
              Strana {currentPage} z {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              Další
            </Button>
          </div>
        )}
        <OrderDetailModal 
          isOpen={isModalOpen}
          onClose={closeModal}
          data={selectedOrder}
          title="Podrobnosti objednávky"
        />
      </CardContent>
    </Card>
  );
} 