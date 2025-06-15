"use client";

import React from 'react';
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Define types locally for now, assuming they will be shared/imported later
interface FetchedProductType {
  id: number;
  name: string;
  vat: { 
    id: number;
    name: string;
    vat: number;
  };
}

interface ProductFromAPI extends FetchedProductType {
  id: number;
  barcode: string;
  name: string;
  price: number;
  amountType: 'KS' | 'KG';
  productTypeId: number;
  productType: {
    id: number;
    name: string;
    vatId: number;
    vat: {
      id: number;
      name: string;
      vat: number;
    };
  };
}

interface FastMenuItemFromAPI {
  id: number;
  productId: number;
  productTypeId: number;
  displayOrder: number | null;
  product: ProductFromAPI;
  productType: FetchedProductType;
}
// End of local type definitions

interface ProductSelectionColumnProps {
  fetchedProductTypes: FetchedProductType[];
  loadingProductTypes: boolean;
  productTypesError: string | null;
  currentProductType: string;
  onSelectProductType: (productTypeName: string) => void;
  fastMenuItemsByProductType: Record<string, FastMenuItemFromAPI[]>;
  loadingFastMenuItems: boolean;
  fastMenuItemsError: string | null;
  onFastMenuItemClick: (product: ProductFromAPI) => void;
}

const ProductSelectionColumn: React.FC<ProductSelectionColumnProps> = ({
  fetchedProductTypes,
  loadingProductTypes,
  productTypesError,
  currentProductType,
  onSelectProductType,
  fastMenuItemsByProductType,
  loadingFastMenuItems,
  fastMenuItemsError,
  onFastMenuItemClick,
}) => {
  return (
    <div className="w-1/3 flex flex-col space-y-2">
      <Card className="flex-none">
        <CardHeader className="p-2">
          <CardTitle className="text-sm">Typy Produktů (FastMenu)</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {loadingProductTypes && <p className="text-xs text-gray-500">Načítání typů...</p>}
          {productTypesError && <p className="text-xs text-red-500">Chyba: {productTypesError}</p>}
          {!loadingProductTypes && !productTypesError && fetchedProductTypes.length > 0 && (
            <Tabs value={currentProductType} onValueChange={onSelectProductType} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                {fetchedProductTypes.map(pt => (
                  <TabsTrigger key={pt.id} value={pt.name} className="text-xs p-2 h-10">{pt.name}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          {!loadingProductTypes && !productTypesError && fetchedProductTypes.length === 0 && (
            <p className="text-xs text-gray-500">Nebyly nalezeny žádné typy produktů.</p>
          )}
        </CardContent>
      </Card>
      <Card className="flex-grow">
        <CardHeader className="p-2">
          <CardTitle className="text-sm">Rychlé Položky ({currentProductType || "Vyberte typ"})</CardTitle>
        </CardHeader>
        <CardContent className="p-2 h-100">
          {loadingFastMenuItems && <p className="text-xs text-gray-500">Načítání rychlých položek...</p>}
          {fastMenuItemsError && <p className="text-xs text-red-500">Chyba: {fastMenuItemsError}</p>}
          <ScrollArea className="h-[calc(79vh-220px)]">
            <div className="grid grid-cols-3 gap-2">
              {currentProductType && fastMenuItemsByProductType[currentProductType] &&
                fastMenuItemsByProductType[currentProductType].map(item => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-16 text-xs whitespace-normal text-center p-1"
                    onClick={() => onFastMenuItemClick(item.product)}
                  >
                    {item.product.name}
                    <br />
                    ({item.product.barcode})
                  </Button>
                ))}
              {currentProductType &&
                (!fastMenuItemsByProductType[currentProductType] || fastMenuItemsByProductType[currentProductType].length === 0) &&
                !loadingFastMenuItems && !fastMenuItemsError && (
                  <p className="col-span-3 text-xs text-gray-500 text-center">Pro tento typ nejsou definovány žádné rychlé položky.</p>
                )}
              {!currentProductType && !loadingProductTypes && !productTypesError && !loadingFastMenuItems && (
                <p className="col-span-3 text-xs text-gray-500 text-center">Vyberte typ produktu pro zobrazení rychlých položek.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductSelectionColumn; 