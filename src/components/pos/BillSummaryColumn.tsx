"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AmountType } from '@/generated/prisma';

interface ScannedItemData {
  id: number | string;
  barcode: string;
  name: string;
  amount: number;
  price: number;
  vatRate: number;
  amountType: AmountType;
}

interface BillSummaryColumnProps {
  totalAmount: number;
  lastScanned: ScannedItemData | null;
  scannedItems: ScannedItemData[];
  selectedBillItemIndex: number | null;
  onSelectItem: (index: number) => void;
  onGoToDashboard: () => void;
  onLogout: () => void;
  onOpenProductSearch: () => void;
}

const BillSummaryColumn: React.FC<BillSummaryColumnProps> = ({
  totalAmount,
  lastScanned,
  scannedItems,
  selectedBillItemIndex,
  onSelectItem,
  onGoToDashboard,
  onLogout,
  onOpenProductSearch,
}) => {
  return (
    <Card className="w-1/3 flex flex-col">
      <CardHeader className="p-4">
        <CardTitle className="text-3xl font-semibold">Celkem</CardTitle>
        <CardDescription className="text-5xl font-bold mt-1">{totalAmount.toFixed(2)} Kč</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-3 p-3">
        <div className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm">
          <h3 className="font-semibold mb-1 text-base">Poslední položka</h3>
          {lastScanned ? (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="truncate" title={lastScanned.barcode}>{lastScanned.barcode}</span>
              <span className="col-span-1 truncate" title={lastScanned.name}>{lastScanned.name}</span>
              <span className="text-right font-medium">{lastScanned.amountType === AmountType.KG ? lastScanned.amount.toFixed(3) : lastScanned.amount} {lastScanned.amountType === AmountType.KS ? 'ks' : 'kg'} x {lastScanned.price.toFixed(2)}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Žádná položka</p>
          )}
        </div>
        <div className="border rounded-lg flex-grow flex flex-col bg-white dark:bg-gray-800 shadow-sm">
          <h3 className="font-semibold text-base px-3 py-2 border-b dark:border-gray-700">Skenované položky</h3>
          <Table className="text-sm">
            <TableHeader className="sticky top-0 z-10 bg-white dark:bg-gray-800">
                <TableRow>
                  <TableHead className="p-2 font-semibold">Kód</TableHead>
                  <TableHead className="p-2 font-semibold">Název</TableHead>
                  <TableHead className="p-2 font-semibold text-center w-[70px]">Množství</TableHead>
                  <TableHead className="p-2 font-semibold text-center w-[60px]">DPH</TableHead>
                  <TableHead className="p-2 font-semibold text-right w-[90px]">Cena bez DPH</TableHead>
                  <TableHead className="p-2 font-semibold text-right w-[90px]">Cena s DPH</TableHead>
                </TableRow>
              </TableHeader>
          </Table>
          <ScrollArea className="flex-grow max-h-[calc(84vh-350px)]">
            <Table className="text-sm">
              <TableBody>
                {scannedItems.map((item, index) => (
                  <TableRow
                    key={`${String(item.id)}-${index}-${item.barcode}`}
                    onClick={() => onSelectItem(index)}
                    className={cn(
                      "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                      selectedBillItemIndex === index ? "bg-blue-100 dark:bg-slate-700 ring-2 ring-blue-500" : ""
                    )}
                  >
                    <TableCell className="w-[90px] font-medium p-2.5 truncate" title={item.barcode}>{item.barcode}</TableCell>
                    <TableCell className="p-2.5 truncate" title={item.name}>{item.name}</TableCell>
                    <TableCell className="w-[70px] p-2.5 text-center font-medium">
                      {item.amountType === AmountType.KG ? item.amount.toFixed(3) : item.amount.toFixed(0)} {item.amountType === AmountType.KS ? 'ks' : 'kg'}
                    </TableCell>
                    <TableCell className="w-[60px] p-2.5 text-center font-medium">{(item.vatRate).toFixed(0)}%</TableCell>
                    <TableCell className="w-[90px] p-2.5 text-right font-medium">{(item.price / (1 + item.vatRate/100) * item.amount).toFixed(2)}</TableCell>
                    <TableCell className="w-[90px] p-2.5 text-right font-medium">{(item.price * item.amount).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {scannedItems.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8 text-base">Nákupní seznam je prázdný.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between space-x-2 border-t dark:border-gray-700">
        <Button onClick={onOpenProductSearch} variant="outline" className="flex-grow h-12 text-base">
          Vyhledat produkt
        </Button>
        <Button onClick={onGoToDashboard} variant="secondary" className="flex-grow h-12 text-base">
          Dashboard
        </Button>
        <Button onClick={onLogout} variant="outline" className="flex-grow h-12 text-base">
          Odhlásit se
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BillSummaryColumn; 