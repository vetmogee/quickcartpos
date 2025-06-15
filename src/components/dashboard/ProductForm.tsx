'use client';

import React, { useRef } from 'react';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { AmountType } from '@/generated/prisma'; // Import enum
import { ProductLabel } from './ProductLabel'; // Import the new ProductLabel component
import { useReactToPrint } from 'react-to-print';

// Define the shape of product type data needed for the select dropdown
interface ProductTypeOption {
  id: number;
  name: string;
}

// Define the shape of product data for the form
interface ProductFormData {
  id?: number;
  name: string;
  barcode: string;
  price: number;
  amountType: AmountType;
  productTypeId: number;
}

// Zod schema for validation
const productFormSchema = z.object({
  name: z.string().min(1, { message: "Název je povinný." }),
  barcode: z.string().min(1, { message: "Čárový kód je povinný." }),
  price: z.coerce
    .number({ required_error: "Cena je povinná.", invalid_type_error: "Cena musí být číslo." }),
  amountType: z.nativeEnum(AmountType, { required_error: "Typ množství je povinný." }),
  productTypeId: z.coerce
        .number({ required_error: "Typ produktu je povinný.", invalid_type_error: "Neplatný typ produktu." })
        .int()
        .positive({ message: "Vyberte prosím platný typ produktu." })
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  product: ProductFormData | null; // null for create, data for edit
  productTypes: ProductTypeOption[]; // List of available types
  onSubmit: (values: ProductFormValues, id?: number) => Promise<void>;
  isSubmitting: boolean;
}

export function ProductForm({
  isOpen,
  setIsOpen,
  product,
  productTypes,
  onSubmit,
  isSubmitting
}: ProductFormProps) {

  const defaultValues = React.useMemo(() => {
      return product
        ? {
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            amountType: product.amountType,
            productTypeId: product.productTypeId,
          }
        : {
            name: '',
            barcode: '',
            price: 0,
            amountType: AmountType.KS, // Default to KS
            productTypeId: productTypes[0]?.id ?? undefined, // Default to first type or undefined if none exist
          };
  }, [product, productTypes]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues,
  });

  // Reset form when product or defaultValues change
  React.useEffect(() => {
    form.reset(defaultValues);
  }, [product, defaultValues, form]);

  const handleFormSubmit = async (values: ProductFormValues) => {
    await onSubmit(values, product?.id);
  };

  const dialogTitle = product ? "Upravit produkt" : "Přidat nový produkt";
  const dialogDescription = product
    ? "Upravte podrobnosti tohoto produktu."
    : "Zadejte podrobnosti pro nový produkt.";
  const submitButtonText = product ? "Uložit změny" : "Vytvořit produkt";

  const labelPrintRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: labelPrintRef,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
             {/* Name */}
             <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<ProductFormValues, 'name'> }) => (
                <FormItem>
                  <FormLabel>Název</FormLabel>
                  <FormControl>
                    <Input placeholder="Např. Jablko Golden" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Barcode */}
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }: { field: ControllerRenderProps<ProductFormValues, 'barcode'> }) => (
                <FormItem>
                  <FormLabel>Čárový kód</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890123" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }: { field: ControllerRenderProps<ProductFormValues, 'price'> }) => (
                  <FormItem>
                    <FormLabel>Cena (Kč)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="25.50" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount Type */}
              <FormField
                control={form.control}
                name="amountType"
                render={({ field }: { field: ControllerRenderProps<ProductFormValues, 'amountType'> }) => (
                  <FormItem>
                    <FormLabel>Jednotka</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte jednotku" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AmountType.KS}>Kus (KS)</SelectItem>
                        <SelectItem value={AmountType.KG}>Kilogram (KG)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Type */}
            <FormField
              control={form.control}
              name="productTypeId"
              render={({ field }: { field: ControllerRenderProps<ProductFormValues, 'productTypeId'> }) => (
                <FormItem>
                  <FormLabel>Typ produktu</FormLabel>
                  <Select 
                     onValueChange={(value: string) => field.onChange(parseInt(value))}
                     value={field.value?.toString()}
                     disabled={isSubmitting || productTypes.length === 0}
                   >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={productTypes.length > 0 ? "Vyberte typ produktu" : "Nejdříve vytvořte typ produktu"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}> 
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {productTypes.length === 0 && (
                     <p className="text-sm text-muted-foreground">Pro přiřazení je potřeba nejprve vytvořit Typ produktu.</p>
                   )}
                </FormItem>
              )}
            />

             <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>Zrušit</Button>
                 </DialogClose>
                 {product && (
                    <Button type="button" variant="outline" disabled={isSubmitting} onClick={handlePrint}>
                        Štítek produktu
                    </Button>
                 )}
                 <Button type="submit" disabled={isSubmitting || (form.formState.isDirty && productTypes.length === 0 && !product?.id)}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                   {submitButtonText}
                 </Button>
             </DialogFooter>
          </form>
        </Form>
        {product && (
          <div style={{ display: 'none' }}> {/* Hidden div for printing */}
            <ProductLabel 
              ref={labelPrintRef} 
              name={product.name} 
              amountType={product.amountType} 
              price={product.price} 
              barcode={product.barcode}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 