//C:\quickcartpos1\src\components\pos\PosReceipt.tsx
'use client';

import React from 'react';
import { AmountType } from '@/generated/prisma';
import { format as formatDate } from 'date-fns';
import { cs } from 'date-fns/locale';

// Interface for individual items on the POS receipt
export interface PosReceiptItemData {
  id: number | string; // Can be number from DB or string for manual entries
  name: string;
  amount: number;
  price: number;
  vatRate: number;
  amountType: AmountType;
}

// Interface for the props of the PosReceipt component
interface PosReceiptProps {
  items: PosReceiptItemData[];
  totalAmount: number;
  paidAmount?: number; // Optional: if payment has been processed and you want to show it
  returnAmount?: number; // Optional
  receiptNumber?: string; // Optional, can be generated within or passed
  orderDate?: Date; // Optional, can be generated within or passed
  user?: {
    fname: string;
    sname: string | null;
    ico: number;
    dic?: string | null;
  };
}

export const PosReceipt = React.forwardRef<HTMLDivElement, PosReceiptProps>((
  { items, totalAmount, paidAmount, returnAmount, receiptNumber: propReceiptNumber, orderDate: propOrderDate, user }, 
  ref
) => {
  if (!items || items.length === 0) return null;

  const orderDate = propOrderDate || new Date();
  const formattedDate = formatDate(orderDate, 'dd.MM.yyyy', { locale: cs });
  const formattedTime = formatDate(orderDate, 'HH:mm:ss', { locale: cs });
  
  const receiptNumber = propReceiptNumber || `EU-${formatDate(orderDate, 'yyyyMMddHHmmss')}`;

  let totalWithoutVat = 0;
  items.forEach(item => {
    const itemTotal = item.price * item.amount;
    totalWithoutVat += (itemTotal / (1 + item.vatRate / 100));
  });
  const totalVatAmount = totalAmount - totalWithoutVat;

  // Company details from user data
  const companyName = user?.fname || "VZOR"; 
  const companyAddress = user?.sname || "Neklanova 18, 128 00 Praha 2";
  const companyDic = user?.dic || "CZxxxxxxxxxx";
  const companyIco = user?.ico?.toString() || "xxxxxx";

  return (
    <div ref={ref} className="p-5 bg-white text-black font-mono text-[10pt] w-[380px]"> {/* Approx width for thermal printer simulation */}
      <div className="text-center mb-2.5">
        <div className="border border-black p-1.5 my-2.5 inline-block tracking-[0.2em] font-bold">
          D A Ň O V Ý   D O K L A D
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
            <th className="text-left border-b border-dashed border-black py-0.5 pr-1">počet jedn.cena</th>
            <th className="border-b border-dashed border-black py-0.5"></th> 
            <th className="text-left border-b border-dashed border-black py-0.5 px-1">sazba DPH</th>
            <th className="text-right border-b border-dashed border-black py-0.5 pl-1">cena</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const itemTotal = item.price * item.amount;
            return (
              <React.Fragment key={`${item.id}-${index}`}>
                <tr>
                  <td colSpan={4} className="py-0.5">{item.name}</td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-1">
                    {item.amountType === AmountType.KG ? item.amount.toFixed(3) : item.amount.toFixed(0)}
                    {item.amountType === AmountType.KS ? 'ks' : 'kg'} x {item.price.toFixed(2)}
                  </td>
                  <td className="py-0.5"></td>
                  <td className="py-0.5 px-1">{item.vatRate.toFixed(0)}%</td>
                  <td className="text-right py-0.5 pl-1">{itemTotal.toFixed(2)}</td>
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
            <td className="text-right py-0.5">{totalAmount.toFixed(2)} Kč</td>
          </tr>
        </tbody>
      </table>
      <hr className="border-dashed border-t border-black my-2.5" />
      <div className="text-center text-[14pt] font-bold mb-2.5">
        CELKEM {totalAmount.toFixed(2)} Kč
      </div>
      {(paidAmount !== undefined && returnAmount !== undefined) && (
        <p className="text-center text-[9pt] mb-2.5">
          Zaplaceno: {paidAmount.toFixed(2)} Kč<br />
          Vráceno: {returnAmount.toFixed(2)} Kč
        </p>
      )}
      <hr className="border-t border-solid border-black my-2.5" />
      <div className="py-0.5">Účtenka: {receiptNumber}</div>
      <div className="py-0.5">Vystaveno: {formattedDate} {formattedTime}</div>
      <div className="py-0.5">Režim: účtenka nepodléhá evidenci tržeb</div>
      <div className="text-center mt-4">---- DĚKUJEME ----</div>
    </div>
  );
});

PosReceipt.displayName = 'PosReceipt'; 