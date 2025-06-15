"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AmountType } from '@/generated/prisma';
import { format as formatDate, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import { toast } from 'sonner';
import { OrderReceipt } from './OrderReceipt';

interface DailySale {
  date: string;
  total: number;
}

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
  user?: { 
    ico?: string | null;
    dic?: string | null;
    fname?: string | null;
    sname?: string | null;
  };
}

type DetailData = DailySale | OrderData;

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DetailData | null;
  title: string;
}

export function OrderDetailModal({ isOpen, onClose, data, title }: OrderDetailModalProps) {
  const receiptPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: data && 'orderItems' in data ? `Uctenka-${data.id}` : 'Uctenka',
    onBeforePrint: () => Promise.resolve(console.log('Priprava tisku uctenky...')),
    onAfterPrint: () => console.log('Tisk uctenky dokoncen.'),
    onPrintError: (_errorLocation, error) => toast.error(`Chyba tisku: ${error.message}`)
  });

  if (!isOpen || !data) return null;

  const isSaleData = (d: DetailData): d is DailySale => 'date' in d && !('orderItems' in d);
  const isOrderData = (d: DetailData): d is OrderData => 'orderItems' in d;

  const orderForReceipt = isOrderData(data) ? data : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {isSaleData(data) && (
            <DialogDescription>
              Podrobnosti o prodeji ze dne: {formatDate(parseISO(data.date), 'P', { locale: cs })}
            </DialogDescription>
          )}
           {isOrderData(data) && (
            <DialogDescription>
              Podrobnosti objednávky ID: {data.id} - {
                (() => {
                  try {
                    const dateTime = parseISO(data.orderDate); 
                    if (isNaN(dateTime.getTime())) return `${data.orderDate} (neplatné datum)`;
                    return formatDate(dateTime, 'P HH:mm:ss', { locale: cs });
                  } catch (e) {
                    console.error("Error formatting order date/time in modal:", e, {orderDate: data.orderDate});
                    return `${data.orderDate} (chyba formátování času)`;
                  }
                })()
              }
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isSaleData(data) && (
            <div>
              <p><strong>Datum:</strong> {formatDate(parseISO(data.date), 'PPP', { locale: cs })}</p>
              <p><strong>Celkem:</strong> {data.total.toFixed(2)} Kč</p>
            </div>
          )}
          {isOrderData(data) && (
            <div>
              <p><strong>Celkem:</strong> {data.total.toFixed(2)} Kč</p>
              <p><strong>Zaplaceno:</strong> {data.paidAmount.toFixed(2)} Kč</p>
              <p><strong>Vráceno:</strong> {data.returnAmount.toFixed(2)} Kč</p>
              {data.subTotal !== null && <p><strong>Mezisoučet (základ DPH):</strong> {data.subTotal.toFixed(2)} Kč</p>}
              {data.dphTotal !== null && <p><strong>DPH celkem:</strong> {data.dphTotal.toFixed(2)} Kč</p>}
              <h4 className="font-semibold mt-3 mb-1">Položky objednávky:</h4>
              {data.orderItems && data.orderItems.length > 0 ? (
                <ul className="list-disc list-inside pl-4 max-h-60 overflow-y-auto">
                  {data.orderItems.map((item, index) => (
                    <li key={`${item.productId}-${index}-${item.orderId}`}> 
                      {item.quantity} {item.product.amountType === AmountType.KG ? 'kg' : 'x'} {item.product.name} 
                      {' @ '} {item.priceAtTime.toFixed(2)} Kč 
                      (DPH: {item.dphAtTime.toFixed(0)}%)
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Žádné položky v této objednávce.</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          {orderForReceipt && orderForReceipt.orderItems && orderForReceipt.orderItems.length > 0 && (
            <Button type="button" variant="default" onClick={handlePrint}>
              Tisk účtenky
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Zavřít
            </Button>
          </DialogClose>
        </DialogFooter>
        
        {orderForReceipt && (
          <div style={{ display: 'none' }}>
            <OrderReceipt ref={receiptPrintRef} order={orderForReceipt} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}