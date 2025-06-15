"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, PlusCircle, ArrowUp, ArrowDown, Save, ChevronsUpDown, Check } from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
// import { ProductData } from './ProductsTab'; // Removed unused and potentially incorrect import

// Interfaces specific to FastMenuTab
interface GlobalProductType {
  id: number;
  name: string;
  vatId: number;
  vat: {
    id: number;
    name: string;
    vat: number;
  };
}

interface UserProduct {
    id: number;
    name: string;
    barcode: string;
    price: number;
    productTypeId: number;
    // Add other relevant product fields if needed for display
}

export interface FastMenuItemData {
  id: number; // FastMenuItem ID
  productId: number;
  productTypeId: number;
  displayOrder: number | null;
  product: UserProduct; // Nested product details
  // productType: GlobalProductType; // The productType under which this item is categorized
}

interface FastMenuTabProps {
  isActive: boolean;
}

const FastMenuTab: React.FC<FastMenuTabProps> = ({ isActive }) => {
  // --- State Variables ---
  const [globalProductTypes, setGlobalProductTypes] = useState<GlobalProductType[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [fastMenuItems, setFastMenuItems] = useState<FastMenuItemData[]>([]);
  
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<string>(""); // Store ID as string for Select
  const [productToAdd, setProductToAdd] = useState<string>(""); // Store ID of product to add
  const [isProductComboboxOpen, setIsProductComboboxOpen] = useState(false); // For Combobox

  const [loadingProductTypes, setLoadingProductTypes] = useState(false);
  const [loadingUserProducts, setLoadingUserProducts] = useState(false);
  const [loadingFastMenuItems, setLoadingFastMenuItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false); // New state for order changes

  // --- Data Fetching --- 
  const fetchGlobalProductTypes = useCallback(async () => {
    setLoadingProductTypes(true);
    try {
      const response = await fetch('/api/dashboard/product-types');
      if (!response.ok) throw new Error('Failed to fetch product types');
      const data = await response.json();
      setGlobalProductTypes(data || []);
      if (data && data.length > 0 && !selectedProductTypeId) {
        setSelectedProductTypeId(data[0].id.toString());
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error fetching product types');
      console.error(error);
    } finally {
      setLoadingProductTypes(false);
    }
  }, [selectedProductTypeId]);

  const fetchUserProducts = useCallback(async () => {
    setLoadingUserProducts(true);
    try {
      // Fetch all products, no pagination for now, as we need them for selection
      const response = await fetch('/api/dashboard/products?pageSize=1000'); // Or a more robust way to get all
      if (!response.ok) throw new Error('Failed to fetch user products');
      const data = await response.json();
      setUserProducts(data.data || []); // Assuming paginated structure from products API
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error fetching user products');
      console.error(error);
    } finally {
      setLoadingUserProducts(false);
    }
  }, []);

  const fetchFastMenuItems = useCallback(async (productTypeId?: number) => {
    setLoadingFastMenuItems(true);
    setHasOrderChanged(false); // Reset order changed flag when fetching
    try {
      let url = '/api/dashboard/fast-menu';
      if (productTypeId) {
        url += `?productTypeId=${productTypeId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch fast menu items');
      const data: FastMenuItemData[] = await response.json();
      // Ensure displayOrder is a number for sorting, assign sequential if null
      const orderedData = data
        .map((item, index) => ({ 
            ...item, 
            displayOrder: item.displayOrder ?? index 
        }))
        .sort((a, b) => (a.displayOrder!) - (b.displayOrder!));      
      setFastMenuItems(orderedData || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error fetching fast menu items');
      console.error(error);
    } finally {
      setLoadingFastMenuItems(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      fetchGlobalProductTypes();
      fetchUserProducts();
    }
  }, [isActive, fetchGlobalProductTypes, fetchUserProducts]);

  useEffect(() => {
    if (isActive && selectedProductTypeId) {
      fetchFastMenuItems(parseInt(selectedProductTypeId));
    }
  }, [isActive, selectedProductTypeId, fetchFastMenuItems]);

  // --- Event Handlers ---
  const handleAddFastMenuItem = async () => {
    if (!selectedProductTypeId || !productToAdd) {
        toast.info("Prosím, vyberte typ produktu a produkt k přidání.");
        return;
    }
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/dashboard/fast-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: parseInt(productToAdd),
                productTypeId: parseInt(selectedProductTypeId),
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add fast menu item');
        }
        toast.success("Položka rychlého menu přidána.");
        fetchFastMenuItems(parseInt(selectedProductTypeId)); // Refresh list to get new order
        setProductToAdd(""); // Reset selection
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Chyba při přidávání položky.');
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRemoveFastMenuItem = async (itemId: number) => {
    setIsSubmitting(true);
    try {
        const response = await fetch(`/api/dashboard/fast-menu/${itemId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to remove fast menu item');
        }
        toast.success("Položka rychlého menu odebrána.");
        fetchFastMenuItems(parseInt(selectedProductTypeId)); // Refresh list
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Chyba při odebírání položky.');
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleMoveItem = (itemId: number, direction: 'up' | 'down') => {
    setFastMenuItems(prevItems => {
      const items = [...prevItems];
      const itemIndex = items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return items;

      const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return items; // Out of bounds

      // Swap items
      const temp = items[itemIndex];
      items[itemIndex] = items[targetIndex];
      items[targetIndex] = temp;

      // Update displayOrder for all items to reflect new visual order
      const updatedItemsWithOrder = items.map((item, index) => ({
        ...item,
        displayOrder: index,
      }));
      
      setHasOrderChanged(true);
      return updatedItemsWithOrder;
    });
  };

  const handleSaveOrder = async () => {
    if (!selectedProductTypeId) return;
    setIsSubmitting(true);
    try {
      const payload = fastMenuItems.map(item => ({
        id: item.id,
        displayOrder: item.displayOrder ?? 0, // Ensure displayOrder is a number
      }));

      const response = await fetch('/api/dashboard/fast-menu/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save order');
      }
      toast.success("Pořadí položek uloženo.");
      setHasOrderChanged(false);
      // Optionally re-fetch to confirm, though local state should be accurate if API succeeded
      // fetchFastMenuItems(parseInt(selectedProductTypeId)); 
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Chyba při ukládání pořadí.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filtered products based on selected product type to suggest relevant ones,
  // or show all if no type selected or for general purpose adding.
  // For FastMenu, we might want to allow adding ANY product to ANY product type category.
  const availableProductsForAdding = userProducts.filter(product => 
    !fastMenuItems.some(item => item.productId === product.id)
  );
  // If we wanted to filter by the selectedProductType's category:
  // const availableProductsForAdding = selectedProductTypeId 
  //    ? userProducts.filter(p => p.productTypeId === parseInt(selectedProductTypeId))
  //    : userProducts;

  const currentFastMenuItems = fastMenuItems; // Already filtered by fetchFastMenuItems

  if (!isActive) return null; // Don't render if not active

  return (
    <Card>
      <CardHeader>
        <CardTitle>Správa Rychlého Menu (Fast Menu)</CardTitle>
        <CardDescription>
          Zde můžete upravit položky, které se zobrazují v rychlém menu na pokladně pro jednotlivé typy produktů.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <label htmlFor="productTypeSelect" className="text-sm font-medium">Vyberte Typ Produktu pro Správu:</label>
            <Select 
                value={selectedProductTypeId}
                onValueChange={(value) => {
                    setSelectedProductTypeId(value);
                    // fetchFastMenuItems will be triggered by useEffect for selectedProductTypeId change
                }}
                disabled={loadingProductTypes}
            >
                <SelectTrigger id="productTypeSelect">
                    <SelectValue placeholder="Načítání typů produktů..." />
                </SelectTrigger>
                <SelectContent>
                    {globalProductTypes.map(pt => (
                        <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                    ))}
                    {globalProductTypes.length === 0 && !loadingProductTypes && <SelectItem value="" disabled>Žádné typy produktů</SelectItem>}
                </SelectContent>
            </Select>
        </div>

        {selectedProductTypeId && (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Přidat Produkt do Rychlého Menu pro &quot;{globalProductTypes.find(pt => pt.id.toString() === selectedProductTypeId)?.name || ''}&quot;</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-end space-x-2">
                        <div className="flex-grow space-y-1">
                            <label htmlFor="productAddCombobox" className="text-xs">Produkt:</label>
                            <Popover open={isProductComboboxOpen} onOpenChange={setIsProductComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isProductComboboxOpen}
                                        className="w-full justify-between h-10"
                                        disabled={loadingUserProducts || isSubmitting}
                                    >
                                        {productToAdd
                                            ? availableProductsForAdding.find(p => p.id.toString() === productToAdd)?.name
                                            : (loadingUserProducts ? "Načítání produktů..." : "Vyberte produkt")}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Hledat produkt..." />
                                        <CommandList>
                                            <CommandEmpty>Žádný produkt nenalezen.</CommandEmpty>
                                            <CommandGroup>
                                                {availableProductsForAdding.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={p.name} // Value used for filtering in CommandInput
                                                        onSelect={(currentValue) => {
                                                            // Find the product by name (currentValue) to get its ID
                                                            const selectedProd = availableProductsForAdding.find(prod => prod.name.toLowerCase() === currentValue.toLowerCase());
                                                            setProductToAdd(selectedProd ? selectedProd.id.toString() : "");
                                                            setIsProductComboboxOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                productToAdd === p.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {p.name} ({p.barcode}) - {p.price.toFixed(2)} Kč
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button onClick={handleAddFastMenuItem} disabled={isSubmitting || !productToAdd} className="h-10">
                            <PlusCircle className="mr-2 h-4 w-4" /> Přidat
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Aktuální Položky v Rychlém Menu</CardTitle>
                        {hasOrderChanged && (
                            <Button onClick={handleSaveOrder} disabled={isSubmitting} size="sm">
                                <Save className="mr-2 h-4 w-4" /> Uložit Pořadí
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>  
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Pořadí</TableHead>
                                <TableHead>Název Produktu</TableHead>
                                <TableHead>Čárový Kód</TableHead>
                                <TableHead>Cena</TableHead>
                                <TableHead className="text-right w-[100px]">Akce</TableHead>
                            </TableRow>
                        </TableHeader>
                      </Table>
                        {loadingFastMenuItems && <p className="text-sm text-muted-foreground">Načítání položek...</p>}
                        {!loadingFastMenuItems && currentFastMenuItems.length === 0 && (
                            <p className="text-sm text-muted-foreground">Pro tento typ produktu nejsou v rychlém menu žádné položky.</p>
                        )}
                        {!loadingFastMenuItems && currentFastMenuItems.length > 0 && ( 
                          
                            <div className="max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableBody>
                                        {currentFastMenuItems.map((item, index) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="space-x-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleMoveItem(item.id, 'up')}
                                                        disabled={isSubmitting || index === 0}
                                                        className="h-7 w-7"
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleMoveItem(item.id, 'down')}
                                                        disabled={isSubmitting || index === currentFastMenuItems.length - 1}
                                                        className="h-7 w-7"
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell>{item.product.name}</TableCell>
                                                <TableCell>{item.product.barcode}</TableCell>
                                                <TableCell>{item.product.price.toFixed(2)} Kč</TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleRemoveFastMenuItem(item.id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FastMenuTab; 