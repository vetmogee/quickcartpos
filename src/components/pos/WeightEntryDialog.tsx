"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Numpad from '@/components/pos/Numpad';
import { Trash2, CornerDownLeft, CheckCircle } from 'lucide-react'; // Import icons

interface WeightEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  weightValue: string;
  onNumpadInput: (key: string) => void; // Handles numeric, '.', '00' from Numpad
  onConfirm: () => void;
  onClearWeight: () => void;
  onBackspaceWeight: () => void;
  onWeightChange: (value: string) => void; // Added for manual input
}

const WeightEntryDialog: React.FC<WeightEntryDialogProps> = ({
  isOpen,
  onOpenChange,
  productName,
  weightValue,
  onNumpadInput, // This will be passed directly to Numpad component
  onConfirm,
  onClearWeight,
  onBackspaceWeight,
  onWeightChange, // Added for manual input
}) => {
  if (!isOpen) return null;

  // Numpad component only calls onNumpadInput with '0'- '9', '.', '00'
  // Clear, Backspace, Enter are handled by dedicated buttons in this dialog

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-xl p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-medium text-gray-700">
            Zadejte váhu pro: {productName || "produkt"}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-3">
          <div className="relative"> {/* Added for positioning the unit */}
            <input
              type="text"
              value={weightValue}
              onChange={(e) => onWeightChange(e.target.value)}
              placeholder="0.000"
              className="text-right text-4xl font-mono p-3 border rounded-md bg-gray-100 h-20 w-full select-none pr-16" // Added w-full and pr-16 for unit
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500 pointer-events-none">kg</span> {/* Positioned unit */}
          </div>
          <Numpad 
            onInput={onNumpadInput} // Correct prop name
            // disabledKeys={['.']} // Example: if you want to disable decimal for some reason
          />
          {/* Action buttons for Clear, Backspace, and potentially Enter if not part of Numpad prop */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button 
              variant="outline"
              className="h-14 text-base active:bg-gray-300 text-orange-600 hover:bg-orange-50 border-orange-300 col-span-1"
              onClick={onClearWeight} 
            >
              <Trash2 className="mr-2 h-5 w-5" /> C
            </Button>
            <Button 
              variant="outline"
              className="h-14 text-base active:bg-gray-300 text-blue-600 hover:bg-blue-50 border-blue-300 col-span-2"
              onClick={onBackspaceWeight} 
            >
              <CornerDownLeft className="mr-2 h-5 w-5" /> Backspace
            </Button>
          </div>
        </div>
        <DialogFooter className="p-4 flex justify-stretch space-x-2 bg-gray-50 border-t rounded-b-lg">
          <DialogClose asChild>
            <Button variant="ghost" className="flex-1 text-gray-700 hover:bg-gray-200 h-12">
              Zrušit
            </Button>
          </DialogClose>
          <Button 
            onClick={onConfirm} 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base"
            disabled={!weightValue || parseFloat(weightValue.replace(',', '.')) <= 0} 
          >
            <CheckCircle className="mr-2 h-5 w-5" /> Potvrdit váhu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WeightEntryDialog; 