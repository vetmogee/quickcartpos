"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ActionsNumpadColumnProps {
  barcodeInputValue: string;
  onBarcodeInputChange: (value: string) => void;
  onInputEnterKey: () => void; // For Enter key in the Input field
  isProcessingBarcode: boolean;
  onNumpadKeyClick: (string: string) => void; // For the main numpad buttons
  onOpenPayAmountDialog: () => void;
  scannedItemsCount: number;
  selectedBillItemIndex: number | null;
  onRemoveSelectedItem: () => void;
  onOpenEditPriceDialog: () => void;
  lastScannedItemId: number | string | null;
  onOpenProductTypeSelectionDialog: () => void;
  onPrintOrder: () => void | Promise<void>; // Changed to allow Promise<void>
  barcodeInputRef: React.RefObject<HTMLInputElement | null>; // Updated type to match actual ref type
}

const ActionsNumpadColumn: React.FC<ActionsNumpadColumnProps> = ({
  barcodeInputValue,
  onBarcodeInputChange,
  onInputEnterKey,
  isProcessingBarcode,
  onNumpadKeyClick,
  onOpenPayAmountDialog,
  scannedItemsCount,
  selectedBillItemIndex,
  onRemoveSelectedItem,
  onOpenEditPriceDialog,
  lastScannedItemId,
  onOpenProductTypeSelectionDialog,
  onPrintOrder,
  barcodeInputRef, // Add ref to destructuring
}) => {
  const numpadKeys = [
    '7', '8', '9', '+',
    '4', '5', '6', 'Backspace',
    '1', '2', '3', 'Clear',
    '.', '0', '00', 'Enter'
  ];

  return (
    <Card className="w-1/3 flex flex-col space-y-2 p-2">
      <Input
        ref={barcodeInputRef} // Add ref to Input
        type="text"
        placeholder="Čárový kód / Množství"
        value={barcodeInputValue}
        onChange={(e) => onBarcodeInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onInputEnterKey(); 
          }
        }}
        className="h-12 text-lg"
        disabled={isProcessingBarcode}
      />
      
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          className="h-28 text-base" 
          onClick={onPrintOrder}
          disabled={scannedItemsCount === 0}
        >
          Tisk
        </Button>
        <Button
          variant="default"
          className="h-28 text-base bg-green-500 hover:bg-green-600 text-white"
          onClick={onOpenPayAmountDialog}
          disabled={scannedItemsCount === 0}
        >
          Kasa
        </Button>
        <Button 
          variant="outline" 
          className="h-28 text-base"
          onClick={onOpenEditPriceDialog}
          disabled={!lastScannedItemId}
        >
          Upravit Cenu
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 flex-grow">
        {numpadKeys.map((key) => (
          <Button
            key={key}
            variant={['+', 'Backspace', 'Clear', 'Enter'].includes(key) ? "secondary" : "outline"}
            className="h-full text-xl active:bg-gray-200 dark:active:bg-gray-600"
            onClick={() => onNumpadKeyClick(key)}
            disabled={isProcessingBarcode && !['Clear', '+'].includes(key)}
          >
            {key === 'Backspace' ? '⌫' : (key === 'Clear' ? 'C' : key)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 h-28">
        <Button
          variant="destructive"
          className="h-full text-lg"
          disabled={selectedBillItemIndex === null}
          onClick={onRemoveSelectedItem}
        >
          Odstranit Vybrané
        </Button>
        <Button
          variant="outline"
          className="h-full text-lg"
          onClick={onOpenProductTypeSelectionDialog}
        >
          Druhy Produktů
        </Button>
      </div>
    </Card>
  );
};

export default ActionsNumpadColumn; 