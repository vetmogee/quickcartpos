"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandList,
    CommandItem,
} from "@/components/ui/command"
import { toast } from "sonner"

// Define Product interface based on typical product data
interface UserProduct {
  id: number;
  name: string;
  barcode: string;
  price: number;
  productTypeId: number;
  productType?: {
    id: number;
    name: string;
    vat: {
      id: number;
      name: string;
      vat: number;
    };
  };
}

interface ProductSearchOption {
  value: string;
  label: string;
  product: UserProduct;
}

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: UserProduct) => void;
}

const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  onProductSelect,
}) => {
  const [searchInput, setSearchInput] = useState("")
  const [productOptions, setProductOptions] = useState<ProductSearchOption[]>([])
  const [loadingUserProducts, setLoadingUserProducts] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUserProducts = useCallback(async (search: string = '') => {
    setLoadingUserProducts(true);
    try {
      const response = await fetch(`/api/pos/products?search=${encodeURIComponent(search)}`);
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login?error=session_expired';
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch user products');
      const products = await response.json();
      
      // Transform products into search options
      const options: ProductSearchOption[] = products.map((product: UserProduct) => ({
        value: product.id.toString(),
        label: `${product.name} (${product.barcode}) - ${product.price.toFixed(2)} Kč`,
        product: product
      }));
      setProductOptions(options);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error fetching user products');
      console.error(error);
    } finally {
      setLoadingUserProducts(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUserProducts();
    }
  }, [isOpen, fetchUserProducts]);

  // Debounced search handler
  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchUserProducts(value);
    }, 300);
  }, [fetchUserProducts]);

  const handleProductSelect = useCallback(
    (option: ProductSearchOption) => {
      onProductSelect(option.product);
      setSearchInput("");
      onClose();
    },
    [onProductSelect, onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vyhledat produkt</DialogTitle>
          <DialogDescription>
            Zadejte název nebo čárový kód produktu
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Command className="rounded-lg border shadow-md" shouldFilter={false}>
            <CommandInput
              placeholder="Hledat produkt..."
              value={searchInput}
              onValueChange={handleSearch}
            />
            <CommandList>
              {loadingUserProducts ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Načítání produktů...
                </div>
              ) : productOptions.length === 0 ? (
                <CommandEmpty>Žádné produkty nenalezeny</CommandEmpty>
              ) : (
                <CommandGroup>
                  {productOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleProductSelect(option)}
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchModal; 