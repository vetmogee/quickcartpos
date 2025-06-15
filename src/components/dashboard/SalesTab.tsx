"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { subDays, format as formatDate, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button';
import { OrderDetailModal } from './OrderDetailModal'; // Import the modal

interface SalesTabProps {
  isActive: boolean;
}

// Interface for the items in the paginated sales data array
interface DailySale {
  date: string;
  total: number;
}

export function SalesTab({ isActive }: SalesTabProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  // salesData is now an array of DailySale objects
  const [salesData, setSalesData] = useState<DailySale[]>([]); 
  const [loadingSales, setLoadingSales] = useState<boolean>(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  // Modal state
  const [selectedSale, setSelectedSale] = useState<DailySale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Pagination State (New) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size, can be adjusted
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (isActive && dateRange?.from && dateRange?.to) {
      const fetchData = async () => {
        setLoadingSales(true);
        setSalesError(null);
        // setSalesData([]); // Decide if clear while loading

        const startDate = dateRange.from!.toISOString().split('T')[0];
        const endDate = dateRange.to!.toISOString().split('T')[0];
        
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
        queryParams.append('page', currentPage.toString());
        queryParams.append('pageSize', pageSize.toString());
        const queryString = queryParams.toString();

        try {
          const response = await fetch(`/api/dashboard/sales?${queryString}`);
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
            setSalesData(result.data); // Now expects an array
            setTotalItems(result.pagination.totalItems);
            setTotalPages(result.pagination.totalPages);
            setCurrentPage(result.pagination.currentPage);
            setPageSize(result.pagination.pageSize);
          } else {
            throw new Error('Invalid sales data format from API.');
          }
        } catch (err) {
          console.error("Failed to fetch sales data:", err);
          setSalesError(err instanceof Error ? err.message : "Error fetching sales data");
          setSalesData([]); // Clear on error
          setTotalItems(0); // Reset pagination
          setTotalPages(0);
        } finally {
          setLoadingSales(false);
        }
      };
      fetchData();
    }
  }, [dateRange, isActive, router, currentPage, pageSize]); // Added currentPage & pageSize

  // Reset to page 1 when dateRange changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange]);

  // --- Modal Handlers ---
  const handleSaleItemClick = (sale: DailySale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
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
        <CardTitle>Přehled prodejů</CardTitle>
        <CardDescription>Vyberte časové období pro zobrazení souhrnu prodejů.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        <div className="mt-4">
          {loadingSales && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Načítání dat o prodejích...</span>
            </div>
          )}
          {salesError && (
            <div className="text-red-600 bg-red-100 border border-red-400 p-3 rounded-md">
              Chyba: {salesError}
            </div>
          )}
          {!loadingSales && !salesError && salesData.length > 0 && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg mb-4 w-auto">
                <h3 className="text-lg font-semibold mb-2">Celkový prodej za období</h3>
                <p className="text-2xl font-bold">
                  {salesData.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)} Kč
                </p>
              </div>
              <ul className="space-y-1 list-disc list-inside">
                {salesData.map((saleDay) => (
                  <li 
                    key={saleDay.date} 
                    onClick={() => handleSaleItemClick(saleDay)} 
                    className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                  >
                    {formatDate(parseISO(saleDay.date), 'PPP', { locale: cs })}: {saleDay.total.toFixed(2)} Kč
                  </li>
                ))}
              </ul>
              {/* Pagination Controls - New */}
              {totalItems > 0 && (
                <div className="flex items-center justify-center space-x-2 py-4 mt-4">
                  <Button // Using Button from @/components/ui/button (should be imported via ProductsTab or directly if needed)
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
            </>
          )}
          {!loadingSales && !salesError && salesData.length === 0 && totalItems === 0 && (
            <p className="text-gray-500">Pro vybrané období nebyla nalezena žádná data o prodejích.</p>
          )}
          {!loadingSales && !salesError && salesData.length === 0 && totalItems > 0 && (
            // This case might happen if API returns empty data for a page but totalItems > 0 (e.g. last page empty)
             <p className="text-gray-500">Žádná další data pro tuto stránku.</p>
          )}
        </div>
        <OrderDetailModal
          isOpen={isModalOpen}
          onClose={closeModal}
          data={selectedSale}
          title="Podrobnosti o prodeji"
        />
      </CardContent>
    </Card>
  );
} 