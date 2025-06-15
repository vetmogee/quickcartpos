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
import { ScrollArea } from "@/components/ui/scroll-area"; // For potentially many product types

// Assuming FetchedProductType is available or defined elsewhere (e.g., imported or passed correctly)
// If not, you'll need to define/import it. For now, let's assume it's:
interface FetchedProductType {
  id: number;
  name: string;
  // vat details might not be strictly needed for selection display but are part of the type
  vat: {
    id: number;
    name: string;
    vat: number;
  };
}

interface ProductTypeSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productTypes: FetchedProductType[];
  onSelectProductType: (productType: FetchedProductType) => void;
  loadingProductTypes: boolean;
}

const ProductTypeSelectionDialog: React.FC<ProductTypeSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  productTypes,
  onSelectProductType,
  loadingProductTypes,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleTypeSelect = (type: FetchedProductType) => {
    onSelectProductType(type);
    // onOpenChange(false); // Or let the parent handle closing after selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vyberte druh produktu pro ruční zadání</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4">
          {loadingProductTypes ? (
            <div className="flex justify-center items-center h-20">
              <p>Načítání druhů produktů...</p>
            </div>
          ) : productTypes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  className="h-20 text-sm whitespace-normal text-center flex items-center justify-center"
                  onClick={() => handleTypeSelect(type)}
                >
                  {type.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Nebyly nalezeny žádné druhy produktů.</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Zavřít
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductTypeSelectionDialog; 