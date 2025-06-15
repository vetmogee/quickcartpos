'use client';

import React from 'react';
import { AmountType } from '@/generated/prisma';
import { format as formatDate, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';

interface ReceiptOrderItemProductData {
    name: string;
    amountType: AmountType;
}
interface ReceiptOrderItemData {
  productId: string;
  orderId: string;
  quantity: number;
  priceAtTime: number;
  dphAtTime: number;
  product: ReceiptOrderItemProductData;
}

interface ReceiptOrderUserData {
    ico?: string | null;
    dic?: string | null;
    fname?: string | null; 
    sname?: string | null; 
}
interface ReceiptOrderData {
  id: string;
  orderDate: string;
  total: number;
  dphTotal: number | null;
  subTotal: number | null;
  paidAmount: number;
  returnAmount: number;
  orderItems: ReceiptOrderItemData[];
  user?: ReceiptOrderUserData | null; // User who placed the order or company associated
}

interface OrderReceiptProps {
  order: ReceiptOrderData;
}

// eslint-disable-next-line react/display-name
export const OrderReceipt = React.forwardRef<HTMLDivElement, OrderReceiptProps>(({ order }, ref) => {
  if (!order) return null;

  const orderDateTime = parseISO(order.orderDate);
  const formattedDate = formatDate(orderDateTime, 'dd.MM.yyyy', { locale: cs });
  const formattedTime = formatDate(orderDateTime, 'HH:mm:ss', { locale: cs });
  const receiptNumber = `EU-${formatDate(orderDateTime, 'yyyyMMdd')}-${String(order.id).substring(0, 4).toUpperCase()}`;

  let totalWithoutVat = 0;
  order.orderItems.forEach(item => {
    const itemTotal = item.priceAtTime * item.quantity;
    totalWithoutVat += (itemTotal / (1 + item.dphAtTime / 100));
  });
  const totalVatAmount = order.total - totalWithoutVat;

  // Company details for receipt header
  // These should ideally come from a central configuration or the logged-in user's company profile
  const companyName = order.user?.fname || "QuickCart POS"; 
  const companyAddress = order.user?.sname || "Neklanova 18"; 
  const companyDic = order.user?.dic || "CZ12345678";
  const companyIco = order.user?.ico || "12345678";

  return (
    <div ref={ref} className="p-5 bg-white text-black font-mono text-[10pt]">
      <div className="text-center mb-2.5">
        <div className="border border-black p-1.5 my-2.5 inline-block tracking-[0.2em] font-bold">
          D A N O V Y D O K L A D
        </div>
      </div>
      <div className="text-center mb-2.5">
        {companyName}<br />
        {companyAddress}<br />
        DIČ: {companyDic}<br />
        IČO: {companyIco}
      </div>
      <hr className="border-t border-dashed border-black my-1.5" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left border-b border-dashed border-black py-0.5">počet jedn.cena</th>
            <th className="py-0.5"></th>
            <th className="text-left border-b border-dashed border-black py-0.5">sazba DPH</th>
            <th className="text-right border-b border-dashed border-black py-0.5">cena</th>
          </tr>
        </thead>
        <tbody>
          {order.orderItems.map((item, index) => {
            const itemTotal = item.priceAtTime * item.quantity;
            return (
              <React.Fragment key={`${item.productId}-${index}`}>
                <tr>
                  <td colSpan={4} className="py-0.5">{item.product.name}</td>
                </tr>
                <tr>
                  <td className="py-0.5">
                    {item.product.amountType === AmountType.KG ? item.quantity.toFixed(3) : item.quantity.toFixed(0)}
                    {item.product.amountType === AmountType.KS ? 'ks' : 'kg'} x {item.priceAtTime.toFixed(2)}
                  </td>
                  <td className="py-0.5"></td>
                  <td className="py-0.5">{item.dphAtTime.toFixed(0)}%</td>
                  <td className="text-right py-0.5">{itemTotal.toFixed(2)}</td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <hr className="border-none border-t border-black my-1.5" />
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="pt-1.5 py-0.5">sazba</td>
            <td className="pt-1.5 py-0.5">bez DPH</td>
            <td className="pt-1.5 py-0.5">DPH</td>
            <td className="text-right pt-1.5 py-0.5">s DPH</td>
          </tr>
          <tr>
            <td className="py-0.5">S.s.</td>
            <td className="py-0.5">{totalWithoutVat.toFixed(2)}</td>
            <td className="py-0.5">{totalVatAmount.toFixed(2)}</td>
            <td className="text-right py-0.5">{order.total.toFixed(2)} Kč</td>
          </tr>
        </tbody>
      </table>
      <hr className="border-dashed border-t border-black my-2.5" />
      <div className="text-center text-[14pt] font-bold mb-2.5">
        CELKEM {order.total.toFixed(2)} Kč
      </div>
      <p className="text-center text-[9pt] mb-2.5">
        Zaplaceno: {order.paidAmount.toFixed(2)} Kč<br />
        Vráceno: {order.returnAmount.toFixed(2)} Kč
      </p>
      <hr className="border-t border-solid border-black my-2.5" />
      <div className="py-0.5">Účtenka: {receiptNumber}</div>
      <div className="py-0.5">Vystaveno: {formattedDate} {formattedTime}</div>
      <div className="py-0.5">Režim: účtenka nepodléhá evidenci tržeb</div>
      <div className="text-center mt-4">---- DĚKUJEME ----</div>
    </div>
  );
});

OrderReceipt.displayName = 'OrderReceipt'; 