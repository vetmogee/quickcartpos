"use client";

import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Numpad from "@/components/pos/Numpad";

interface PayAmountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  amountToPay: number;
  paidAmountDisplay: string; // Value for the display input
  returnAmount: number;
  onNumpadKeyProcess: (key: string) => void; // Renamed: Processes keys from Numpad (numeric, dot, 00)
  onConfirm: () => void;
  onClearPaidAmount: () => void; // Specifically for the clear button
  onBackspacePaidAmount: () => void; // Specifically for the backspace button
  onPaidAmountChange: (value: string) => void; // New prop for direct input changes
}

const PayAmountDialog: React.FC<PayAmountDialogProps> = ({
  isOpen,
  onOpenChange,
  amountToPay,
  paidAmountDisplay,
  returnAmount,
  onNumpadKeyProcess,
  onConfirm,
  onClearPaidAmount,
  onBackspacePaidAmount,
  onPaidAmountChange, // Destructure new prop
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Zaplatit Objednávku</DialogTitle>
        </DialogHeader>
        <div className="px-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-lg font-medium">Celkem k Zaplacení:</span>
            <span className="text-2xl font-bold">{amountToPay.toFixed(2)} Kč</span>
          </div>

          <div className="space-y-2">
            <label htmlFor="paidAmountDisplayInput" className="text-sm font-medium">Zaplaceno Zákazníkem:</label>
            <Input
              id="paidAmountDisplayInput"
              type="text"
              value={paidAmountDisplay}
              onChange={(e) => onPaidAmountChange(e.target.value)} // Handle direct input
              placeholder="0.00 Kč"
              className="h-16 text-3xl text-right font-mono bg-gray-100 dark:bg-gray-700"
            />
          </div>

          <Numpad
            onInput={(key) => {
              if (key === 'Enter') {
                onConfirm();
              } else if (key !== 'Backspace' && key !== 'Clear') { // Numpad itself won't send these for this dialog
                onNumpadKeyProcess(key); // Parent handles appending to its paidAmountInput state
              }
            }}
          />

          {/* Dedicated Backspace and Clear buttons */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Button
              variant="outline"
              className="h-16 text-lg"
              onClick={onBackspacePaidAmount} 
            >
              ⌫ <span className="sr-only">Backspace</span>
            </Button>
            <Button
              variant="destructive"
              className="h-16 text-lg"
              onClick={onClearPaidAmount}
            >
              Vymazat <span className="sr-only">Clear</span>
            </Button>
          </div>

          <div className="flex justify-between items-center py-3 border-t mt-3">
            <span className="text-lg font-medium">Vrátit:</span>
            <span className="text-2xl font-bold text-orange-500">{returnAmount.toFixed(2)} Kč</span>
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 bg-gray-50 dark:bg-gray-800 flex flex-col sm:flex-col gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-14 text-lg w-full">Zrušit</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={parseFloat(paidAmountDisplay) < amountToPay || isNaN(parseFloat(paidAmountDisplay))}
            className="h-14 text-lg w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Potvrdit Platbu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayAmountDialog; 