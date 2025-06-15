"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { ProductForm } from '@/components/dashboard/ProductForm';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from 'next/navigation';
import { AmountType } from '@/generated/prisma'; // Assuming this type is still needed from prisma

// --- Interface Definitions ---
interface VatData {
    id: number;
    name: string;
    vat: number;
}
interface ProductTypeData {
  id: number;
  name: string;
  vatId: number;
  vat: VatData;
}

interface ProductData {
  id: number;
  barcode: string;
  name: string;
  price: number;
  amountType: AmountType;
  productTypeId: number;
  userId?: number; 
  productType: ProductTypeData;
}

interface ProductFormValues { 
  name: string; 
  barcode: string; 
  price: number; 
  amountType: AmountType; 
  productTypeId: number; 
}

interface ItemToDelete {
    id: number;
    name: string;
    type: 'product';
}

interface ProductFilters {
  name?: string;
  barcode?: string;
  minPrice?: string;
  maxPrice?: string;
  productTypeIds?: number[];
}

interface ProductsTabProps {
  isActive: boolean;
}

export function ProductsTab({ isActive }: ProductsTabProps) {
  const router = useRouter();

  // --- Products State ---
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // --- Product Types State ---
  const [productTypes, setProductTypes] = useState<ProductTypeData[]>([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState<boolean>(false);
  const [productTypesError, setProductTypesError] = useState<string | null>(null);

  // --- Dialog/Modal State ---
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // --- Filter State ---
  const [filterName, setFilterName] = useState('');
  const [filterBarcode, setFilterBarcode] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterSelectedProductTypeIds, setFilterSelectedProductTypeIds] = useState<number[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>({});

  // --- Pagination State (New) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Default page size
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // --- Data Fetching ---
  const fetchProductTypes = useCallback(async () => {
    setLoadingProductTypes(true);
    setProductTypesError(null);
    try {
      const typesResponse = await fetch('/api/dashboard/product-types');
      const typesResult = await typesResponse.json();
      if (!typesResponse.ok) {
        const errorMessage = typesResult.error || `HTTP error! status: ${typesResponse.status}`;
        throw new Error(errorMessage);
      }
      if (Array.isArray(typesResult)) {
        setProductTypes(typesResult);
      } else {
        throw new Error('Product Types: Invalid data format.');
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      setProductTypesError(error instanceof Error ? error.message : "Could not load product types");
      setProductTypes([]);
    } finally {
      setLoadingProductTypes(false);
    }
  }, []); // No dependencies as it's a stable fetch

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError(null);
    // setProducts([]); // Don't clear products here if we want to show old data while new page loads, clear on filter change instead or before fetch.

    const queryParams = new URLSearchParams();
    if (appliedFilters.name) queryParams.append('name', appliedFilters.name);
    if (appliedFilters.barcode) queryParams.append('barcode', appliedFilters.barcode);
    if (appliedFilters.minPrice) queryParams.append('minPrice', appliedFilters.minPrice);
    if (appliedFilters.maxPrice) queryParams.append('maxPrice', appliedFilters.maxPrice);
    if (appliedFilters.productTypeIds && appliedFilters.productTypeIds.length > 0) {
      queryParams.append('productTypeIds', appliedFilters.productTypeIds.join(','));
    }
    // Add pagination params
    queryParams.append('page', currentPage.toString());
    queryParams.append('pageSize', pageSize.toString());
    
    const queryString = queryParams.toString();

    try {
      const productsResponse = await fetch(`/api/dashboard/products${queryString ? `?${queryString}` : ''}`);
      const result = await productsResponse.json(); // Renamed from productsResult
      if (!productsResponse.ok) {
        const errorMessage = result.error || `HTTP error! status: ${productsResponse.status}`;
        if (productsResponse.status === 401) { router.push('/login?error=session_expired'); return; }
        throw new Error(errorMessage);
      }
      // Expecting { data: [], pagination: { ... } } structure
      if (result && Array.isArray(result.data) && result.pagination) {
        setProducts(result.data);
        setTotalItems(result.pagination.totalItems);
        setTotalPages(result.pagination.totalPages);
        setCurrentPage(result.pagination.currentPage); // Ensure current page from API is set (e.g. if API corrected it)
        setPageSize(result.pagination.pageSize); // Ensure page size from API is set
      } else {
        throw new Error('Invalid products data format from API.');
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProductsError(err instanceof Error ? err.message : "Error fetching products");
      setProducts([]); // Clear products on error
      setTotalItems(0); // Reset pagination on error
      setTotalPages(0);
    } finally {
      setLoadingProducts(false);
    }
  }, [router, appliedFilters, currentPage, pageSize]); // Added currentPage and pageSize as dependencies

  useEffect(() => {
    if (isActive) {
      if (productTypes.length === 0 && !loadingProductTypes) {
        fetchProductTypes();
      }
      // Fetch products if types are loaded OR if types are currently loading (will pick up after type fetch completes)
      // This ensures products are fetched/refreshed when filters change, even if types were already there.
      if (productTypes.length > 0 || loadingProductTypes) { 
          fetchProducts();
      }
    } else {
        // Optionally clear data when tab is not active to save memory / ensure fresh load
        // setProducts([]);
        // setProductTypes([]); 
    }
  }, [isActive, productTypes.length, loadingProductTypes, fetchProductTypes, fetchProducts]);
  
  // This specific effect listens to `appliedFilters` directly to trigger `fetchProducts` when filters change
  // It ensures that if the tab is active and types are present, a filter change re-fetches products.
  useEffect(() => {
    if (isActive && (productTypes.length > 0 || loadingProductTypes)) {
      // When filters are applied, reset to page 1 before fetching
      // However, this effect also runs on initial load or tab switch if conditions met.
      // We only want to reset to page 1 if appliedFilters themselves changed.
      // A more robust way: handleCurrentPageResetOnFilterChange in handleApplyFilters.
      // For now, let fetchProducts use its current currentPage.
      // If `appliedFilters` is a dependency, changing it will trigger this, which is fine.
      // fetchProducts();
      // The above line is commented because `fetchProducts` is already a dependency of the main useEffect.
      // Let's simplify: the main `useEffect` already handles fetching when `appliedFilters` (via `fetchProducts` dep) changes.
    }
  }, [isActive, appliedFilters, productTypes.length, loadingProductTypes]); // Removed fetchProducts from here to avoid loop with main effect

  // --- Pagination Handlers (New) ---
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      // fetchProducts will be called by the useEffect listening to currentPage changes.
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      // fetchProducts will be called by the useEffect listening to currentPage changes.
    }
  };
  
    // When filters are applied, reset to page 1
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page on new filter application
    setAppliedFilters({
      name: filterName,
      barcode: filterBarcode,
      minPrice: filterMinPrice,
      maxPrice: filterMaxPrice,
      productTypeIds: filterSelectedProductTypeIds,
    });
    // fetchProducts will be triggered by useEffect due to appliedFilters/currentPage change
  };

  const handleClearFilters = () => {
    setCurrentPage(1); // Reset to first page
    setFilterName('');
    setFilterBarcode('');
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterSelectedProductTypeIds([]);
    setAppliedFilters({});
  };

  const handleProductTypeFilterChange = (typeId: number) => {
    setFilterSelectedProductTypeIds(prev =>
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
  };

  // --- Product Handlers ---
  const handleOpenAddProduct = () => {
    if (productTypes.length === 0 && !loadingProductTypes && !productTypesError) {
        toast.info("Načítají se typy produktů. Prosím, počkejte.");
        if (!loadingProductTypes) fetchProductTypes();
        return;
    } else if (productTypes.length === 0 && productTypesError){
        toast.error("Chyba při načítání typů produktů. Nelze přidat produkt.");
        return;
    } else if (productTypes.length === 0) {
        toast.warning("V systému nejsou definovány žádné typy produktů.");
        return;
    }
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: ProductData) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleProductFormSubmit = async (values: ProductFormValues, id?: number) => {
    setIsSubmittingProduct(true);
    const url = id ? `/api/dashboard/products/${id}` : '/api/dashboard/products';
    const method = id ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || (id ? 'Failed to update product' : 'Failed to create product'));
      }
      toast.success(id ? "Produkt úspěšně aktualizován." : "Produkt úspěšně vytvořen.");
      setIsProductFormOpen(false);
      fetchProducts(); // Refetch products list
    } catch (error) {
      console.error("Product Form Error:", error);
      toast.error(error instanceof Error ? error.message : "Došlo k chybě.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleOpenDeleteProductDialog = (product: ProductData) => {
    setItemToDelete({ id: product.id, name: product.name, type: 'product' });
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || itemToDelete.type !== 'product') return;
    setIsDeletingItem(true);
    const { id, name } = itemToDelete;
    const url = `/api/dashboard/products/${id}`;
    try {
      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to delete ${name}`);
      }
      toast.success(`Produkt "${name}" úspěšně smazán.`);
      setIsConfirmDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchProducts(); // Refetch products list
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(error instanceof Error ? error.message : "Došlo k chybě při mazání.");
    } finally {
      setIsDeletingItem(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Filter Sidebar */}
      <Card className="w-full md:w-1/4 lg:w-1/5 p-0 h-165">
        <CardContent className="p-4 space-y-4">
        <CardTitle className="text-lg">Filtry</CardTitle>
          <div>
            <Label htmlFor="filterName" className="text-sm font-medium">Název produktu</Label>
            <Input
              id="filterName"
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Např. Mléko"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="filterBarcode" className="text-sm font-medium">Čárový kód</Label>
            <Input
              id="filterBarcode"
              type="text"
              value={filterBarcode}
              onChange={(e) => setFilterBarcode(e.target.value)}
              placeholder="Např. 8591234567890"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="filterMinPrice" className="text-sm font-medium">Min. cena (Kč)</Label>
            <Input
              id="filterMinPrice"
              type="number"
              value={filterMinPrice}
              onChange={(e) => setFilterMinPrice(e.target.value)}
              placeholder="0"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="filterMaxPrice" className="text-sm font-medium">Max. cena (Kč)</Label>
            <Input
              id="filterMaxPrice"
              type="number"
              value={filterMaxPrice}
              onChange={(e) => setFilterMaxPrice(e.target.value)}
              placeholder="1000"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Typ produktu</Label>
            {loadingProductTypes && <p className="text-xs text-gray-500 mt-1">Načítání typů...</p>}
            {productTypesError && <p className="text-xs text-red-500 mt-1">Chyba načítání typů: {productTypesError.substring(0,100)}</p>}
            {!loadingProductTypes && !productTypesError && productTypes.length > 0 && (
              <ScrollArea className="h-[150px] mt-1 border rounded-md p-2">
                {productTypes.map((pt) => (
                  <div key={pt.id} className="flex items-center space-x-2 mb-1">
                    <Checkbox
                      id={`filter-type-${pt.id}`}
                      checked={filterSelectedProductTypeIds.includes(pt.id)}
                      onCheckedChange={() => handleProductTypeFilterChange(pt.id)}
                    />
                    <Label htmlFor={`filter-type-${pt.id}`} className="text-xs font-normal cursor-pointer">
                      {pt.name}
                    </Label>
                  </div>
                ))}
              </ScrollArea>
            )}
            {!loadingProductTypes && !productTypesError && productTypes.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Žádné typy produktů.</p>
            )}
          </div>
          <div className="flex flex-col space-y-2 pt-2">
            <Button onClick={handleApplyFilters} size="sm" className="text-xs">Použít filtry</Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm" className="text-xs">Vymazat filtry</Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <div className="flex-grow">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Produkty</CardTitle>
              <CardDescription>Spravujte jednotlivé položky produktů.</CardDescription>
            </div>
            <Button 
                onClick={handleOpenAddProduct} 
                size="sm" 
                disabled={loadingProductTypes || (productTypes.length === 0 && !productTypesError)}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Přidat produkt
            </Button>
          </CardHeader>
          <CardContent>
            {loadingProductTypes && products.length === 0 && (
              <div className="flex items-center justify-center py-4 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Načítání typů produktů...</span>
              </div>
            )}
            {productTypesError && (
              <div className="text-red-600 bg-red-100 border border-red-400 p-3 rounded-md mb-4">
                Chyba při načítání typů produktů: {productTypesError}.
              </div>
            )}
            {loadingProducts && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Načítání produktů...</span>
              </div>
            )}
            {productsError && !loadingProducts && (
              <div className="text-red-600 bg-red-100 border border-red-400 p-3 rounded-md">
                Chyba při načítání produktů: {productsError}
              </div>
            )}
            {!loadingProducts && !productsError && (
              products.length > 0 ? (
                <ScrollArea className="h-[calc(60vh - 40px)]">
                  <Table>
                    <TableCaption>
                      Seznam vašich produktů
                      {appliedFilters.name || appliedFilters.minPrice || appliedFilters.maxPrice || (appliedFilters.productTypeIds && appliedFilters.productTypeIds.length > 0) ? " (filtrováno)" : ""}.
                      {totalItems > 0 && ` Strana ${currentPage} z ${totalPages}. Celkem ${totalItems} položek.`}
                      {products.length > 0 && ` Na této stránce je ${products.length} produktů.`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Název</TableHead>
                        <TableHead>Čárový kód</TableHead>
                        <TableHead>Cena</TableHead>
                        <TableHead>Jednotka</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>DPH typu (%)</TableHead>
                        <TableHead className="text-right">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.barcode}</TableCell>
                          <TableCell>{product.price.toFixed(2)} Kč</TableCell>
                          <TableCell>{product.amountType}</TableCell>
                          <TableCell>{product.productType.name}</TableCell>
                          <TableCell>{product.productType.vat.name} ({product.productType.vat.vat}%)</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenEditProduct(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteProductDialog(product)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                !loadingProductTypes && !productTypesError && <p className="text-gray-500 text-center py-4">Nebyly nalezeny žádné produkty. {appliedFilters.name || appliedFilters.minPrice || appliedFilters.maxPrice || (appliedFilters.productTypeIds && appliedFilters.productTypeIds.length > 0) ? "Zkuste upravit filtry." : "Pro začátek přidejte nový."}</p>
              )
            )}
            {/* Pagination Controls - New */}
            {!loadingProducts && totalItems > 0 && (
              <div className="flex items-center justify-center space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                >
                  Předchozí
                </Button>
                <span className="text-sm text-muted-foreground">
                  Strana {currentPage} z {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Další
                </Button>
              </div>
            )}
            {!loadingProductTypes && productTypes.length === 0 && !productTypesError && !productsError && (
              <p className="text-amber-600 bg-amber-50 border border-amber-400 p-3 rounded-md mt-4 text-center">
                V systému nejsou definovány žádné typy produktů. Pro přidání produktů je nutné je nejprve definovat administrátorem.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {isProductFormOpen && (
        <ProductForm 
            isOpen={isProductFormOpen}
            setIsOpen={setIsProductFormOpen}
            product={editingProduct}
            productTypes={productTypes.map(pt => ({ id: pt.id, name: pt.name }))} 
            onSubmit={handleProductFormSubmit}
            isSubmitting={isSubmittingProduct}
        />
      )}
      {isConfirmDeleteDialogOpen && itemToDelete && (
        <ConfirmationDialog 
            isOpen={isConfirmDeleteDialogOpen}
            onOpenChange={setIsConfirmDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            title={`Opravdu smazat produkt?`}
            description={`Chystáte se trvale smazat produkt &quot;${itemToDelete.name}&quot;. Tuto akci nelze vrátit.`} 
            confirmText="Smazat"
            isConfirming={isDeletingItem}
        />
      )}
    </div>
  );
} 