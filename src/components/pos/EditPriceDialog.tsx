"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScannedItemData } from '@/app/pos/page';

interface EditPriceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScannedItemData | null;
  newPrice: string;
  onNumpadInput: (key: string) => void;
  onConfirm: () => void;
  onClearNewPrice: () => void;
  onBackspaceNewPrice: () => void;
  onNewPriceDirectChange: (value: string) => void;
}

const NumpadButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className }) => (
  <Button
    variant="outline"
    className={`text-xl h-16 w-full ${className}`}
    onClick={onClick}
  >
    {children}
  </Button>
);

const EditPriceDialog: React.FC<EditPriceDialogProps> = ({
  isOpen,
  onOpenChange,
  item,
  newPrice,
  onNumpadInput,
  onConfirm,
  onClearNewPrice,
  onBackspaceNewPrice,
  onNewPriceDirectChange,
}) => {
  if (!isOpen || !item) {
    return null;
  }

  const handleNumpadClick = (key: string) => {
    onNumpadInput(key);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Upravit cenu pro: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Aktuální cena: {item.price.toFixed(2)} Kč</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold">Nová cena:</span>
            <Input
              type="text"
              value={newPrice}
              onChange={(e) => onNewPriceDirectChange(e.target.value)}
              placeholder="0.00"
              className="text-lg h-12 text-right flex-1"
            />
             <span className="text-lg font-semibold">Kč</span>
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'].map((key) => (
            <NumpadButton key={key} onClick={() => handleNumpadClick(key)}>
              {key}
            </NumpadButton>
          ))}
          <Button variant="outline" className="text-xl h-16 col-span-1" onClick={onBackspaceNewPrice}>
            &larr;
          </Button>
           <Button variant="outline" className="text-xl h-16 col-span-1" onClick={onClearNewPrice}>
            C
          </Button>
           <Button
            variant="default"
            className="text-xl h-16 col-span-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={onConfirm}
            disabled={!newPrice || parseFloat(newPrice.replace(',', '.')) < 0}
          >
            OK
          </Button>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Zrušit
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPriceDialog; 