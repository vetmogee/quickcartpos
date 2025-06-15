"use client";

import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Numpad from "@/components/pos/Numpad"; // Assuming Numpad is in the same directory or path is adjusted

// Define types locally
interface FetchedProductType {
  id: number;
  name: string;
  vat: { 
    id: number;
    name: string;
    vat: number;
  };
}
// End local type definitions

interface ManualEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productType: FetchedProductType | null; // Dialog is only shown if this is not null
  entryPrice: string; // Current value of the price being entered
  onNumpadInput: (key: string) => void; // For the Numpad inside
  onConfirm: () => void;
  onClearEntryPrice: () => void; // To clear the entryPrice state in parent
  onBackspaceEntryPrice: () => void; // To handle backspace for entryPrice in parent
}

const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({
  isOpen,
  onOpenChange,
  productType,
  entryPrice,
  onNumpadInput,
  onConfirm,
  onClearEntryPrice,
  onBackspaceEntryPrice,
}) => {
  if (!productType) return null; // Should not render if productType is null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">Cena pro: {productType.name}</DialogTitle>
          <DialogDescription>
            Zadejte prodejní cenu pro položku typu &quot;{productType.name}&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <Input
            id="manualPriceDisplay"
            type="text"
            value={entryPrice} // Display the passed-in price
            readOnly
            placeholder="0.00 Kč"
            className="h-16 text-3xl text-right font-mono"
          />
          <Numpad onInput={onNumpadInput} /> {/* Parent's numpad handler for price */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              className="h-16 text-lg"
              onClick={onBackspaceEntryPrice} // Parent handles backspace logic
            >
              ⌫ <span className="sr-only">Backspace</span>
            </Button>
            <Button
              variant="destructive"
              className="h-16 text-lg"
              onClick={onClearEntryPrice} // Parent handles clear logic
            >
              Vymazat <span className="sr-only">Clear</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 bg-gray-50 dark:bg-gray-800 sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-14 text-lg w-full sm:w-auto">Zrušit</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onConfirm} // Parent handles confirmation
            className="h-14 text-lg w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            Potvrdit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualEntryDialog; 