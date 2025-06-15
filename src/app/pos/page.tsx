"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from 'sonner';
import { formatDate } from 'date-fns';

import BillSummaryColumn from "@/components/pos/BillSummaryColumn";
import ProductSelectionColumn from "@/components/pos/ProductSelectionColumn";
import ActionsNumpadColumn from "@/components/pos/ActionsNumpadColumn";
import ManualEntryDialog from "@/components/pos/ManualEntryDialog";
import PayAmountDialog from "@/components/pos/PayAmountDialog";
import WeightEntryDialog from "@/components/pos/WeightEntryDialog";
import EditPriceDialog from "@/components/pos/EditPriceDialog";
import ProductTypeSelectionDialog from "@/components/pos/ProductTypeSelectionDialog";
import { PosReceipt } from "@/components/pos/PosReceipt";
import ProductSearchModal from "@/components/pos/ProductSearchModal";
import { ProductForm } from "@/components/dashboard/ProductForm";
import type { ProductFormValues } from "@/components/dashboard/ProductForm";

interface FetchedProductType {
  id: number;
  name: string;
  vat: { // Added to ensure VAT details are available
    id: number;
    name: string;
    vat: number;
  };
}

// Interface for products from ProductSearchModal
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

// New interface for items in the bill
export interface ScannedItemData {
  id: number | string; // Allow string for manual entries like `MANUAL_${productTypeId}`
  barcode: string;
  name: string;
  amount: number;
  price: number;
  productTypeId: number;
  vatRate: number;
  amountType: 'KS' | 'KG'; // Added: type of amount (komada/kilogram)
}

// Full Product data from API (includes nested ProductType and VAT)
interface ProductFromAPI extends FetchedProductType { // FetchedProductType is {id, name}
  id: number;
  barcode: string;
  name: string;
  price: number;
  amountType: 'KS' | 'KG'; // Assuming AmountType enum from Prisma
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

// Interface for Fast Menu Items fetched from API
interface FastMenuItemFromAPI {
    id: number; // FastMenuItem ID
    productId: number;
    productTypeId: number;
    displayOrder: number | null;
    product: ProductFromAPI; // Full product details
    productType: FetchedProductType; // The product type category it belongs to
}

export default function POSPage() {
  const router = useRouter();
  const receiptPrintRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // --- State for Product Types ---
  const [fetchedProductTypes, setFetchedProductTypes] = useState<FetchedProductType[]>([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState(true);
  const [productTypesError, setProductTypesError] = useState<string | null>(null);
  const [currentProductType, setCurrentProductType] = useState<string>("");

  // --- State for Fast Menu Items ---
  const [fastMenuItemsByProductType, setFastMenuItemsByProductType] = useState<Record<string, FastMenuItemFromAPI[]>>({});
  const [loadingFastMenuItems, setLoadingFastMenuItems] = useState(false);
  const [fastMenuItemsError, setFastMenuItemsError] = useState<string | null>(null);

  // --- State for Barcode Input & Bill (initially with dummy for structure) ---
  const [barcodeInputValue, setBarcodeInputValue] = React.useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItemData[]>([]);
  const [lastScanned, setLastScanned] = useState<ScannedItemData | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const [selectedBillItemIndex, setSelectedBillItemIndex] = useState<number | null>(null);

  // --- State for Manual Price Entry Dialog ---
  const [isManualEntryDialogOpen, setIsManualEntryDialogOpen] = useState(false);
  const [manualEntryProductType, setManualEntryProductType] = useState<FetchedProductType | null>(null);
  const [manualEntryPrice, setManualEntryPrice] = useState("");

  // --- State for Pay Amount Dialog ---
  const [isPayAmountDialogOpen, setIsPayAmountDialogOpen] = useState(false);
  const [amountToPay, setAmountToPay] = useState(0);
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [returnAmount, setReturnAmount] = useState(0);

  // --- State for Weight Entry Dialog ---
  const [isWeightEntryDialogOpen, setIsWeightEntryDialogOpen] = useState(false);
  const [weightEntryProductData, setWeightEntryProductData] = useState<ProductFromAPI | null>(null);
  const [weightEntryInputValue, setWeightEntryInputValue] = useState("");

  // --- State for Edit Price Dialog ---
  const [isEditPriceDialogOpen, setIsEditPriceDialogOpen] = useState(false);
  const [itemForPriceEdit, setItemForPriceEdit] = useState<ScannedItemData | null>(null);
  const [newPriceInputValue, setNewPriceInputValue] = useState("");

  // --- State for Product Type Selection Dialog ---
  const [isProductTypeSelectionDialogOpen, setIsProductTypeSelectionDialogOpen] = useState(false);

  // --- State for Receipt ---
  const [paidAmountForReceipt, setPaidAmountForReceipt] = useState<number | undefined>(undefined);
  const [returnAmountForReceipt, setReturnAmountForReceipt] = useState<number | undefined>(undefined);
  const [currentOrderDateForReceipt, setCurrentOrderDateForReceipt] = useState<Date | undefined>(undefined);
  const [currentReceiptNumber, setCurrentReceiptNumber] = useState<string | undefined>(undefined);

  // --- State for Product Search Modal ---
  const [isProductSearchModalOpen, setIsProductSearchModalOpen] = useState(false);

  // --- State for Product Creation Dialog ---
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState<string>("");

  // Load initial state from sessionStorage on mount
  useEffect(() => {
    try {
      const savedItems = sessionStorage.getItem('posScannedItems');
      const savedLastScanned = sessionStorage.getItem('posLastScanned');
      
      if (savedItems) {
        setScannedItems(JSON.parse(savedItems));
      }
      if (savedLastScanned) {
        setLastScanned(JSON.parse(savedLastScanned));
      }
    } catch (error) {
      console.error('Error loading state from sessionStorage:', error);
    }
  }, []);

  // Update sessionStorage whenever scannedItems or lastScanned changes
  useEffect(() => {
    try {
      sessionStorage.setItem('posScannedItems', JSON.stringify(scannedItems));
      sessionStorage.setItem('posLastScanned', JSON.stringify(lastScanned));
    } catch (error) {
      console.error('Error saving state to sessionStorage:', error);
    }
  }, [scannedItems, lastScanned]);

  // Cleanup function to remove sessionStorage data when component unmounts
  useEffect(() => {
    return () => {
      // Only clear if we're not navigating to dashboard
      if (!window.location.pathname.includes('/dashboard')) {
        sessionStorage.removeItem('posScannedItems');
        sessionStorage.removeItem('posLastScanned');
      }
    };
  }, []);

  // Global Keydown Listener for Arrow Up/Down navigation in bill
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (scannedItems.length === 0) return;

      if (event.key === 'ArrowUp') {
        event.preventDefault(); // Prevent scrolling
        setSelectedBillItemIndex(prevIndex => {
          if (prevIndex === null) {
            return scannedItems.length - 1; // Select last item if none selected
          }
          return Math.max(0, prevIndex - 1); // Move up, stop at 0
        });
        setBarcodeInputValue(""); // Clear input as it's a navigation action
      } else if (event.key === 'ArrowDown') {
        event.preventDefault(); // Prevent scrolling
        setSelectedBillItemIndex(prevIndex => {
          if (prevIndex === null) {
            return 0; // Select first item if none selected
          }
          return Math.min(scannedItems.length - 1, prevIndex + 1); // Move down, stop at last item
        });
        setBarcodeInputValue(""); // Clear input as it's a navigation action
      } else if (event.key === 'Escape'){
        event.preventDefault();
        setSelectedBillItemIndex(null);    
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [scannedItems, setSelectedBillItemIndex, setBarcodeInputValue]); // Added selectedBillItemIndex to dependencies

  // Fetch Product Types
  useEffect(() => {
    const fetchTypes = async () => {
      setLoadingProductTypes(true);
      setProductTypesError(null);
      try {
        const response = await fetch('/api/dashboard/product-types');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch product types: ${response.status}`);
        }
        const data: FetchedProductType[] = await response.json();
        setFetchedProductTypes(data);
        if (data.length > 0) {
          setCurrentProductType(data[0].name); // Set first type as current
        }
      } catch (error) {
        console.error("Error fetching product types:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        setProductTypesError(errorMessage);
        toast.error("Chyba při načítání typů produktů: " + errorMessage);
      } finally {
        setLoadingProductTypes(false);
      }
    };
    fetchTypes();
  }, []);

  // Fetch Fast Menu Items when product types are loaded
  useEffect(() => {
    const fetchFastMenu = async () => {
      if (fetchedProductTypes.length === 0) return; // Don't fetch if no product types

      setLoadingFastMenuItems(true);
      setFastMenuItemsError(null);
      try {
        const response = await fetch('/api/dashboard/fast-menu'); // Get all for the user
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch fast menu items: ${response.status}`);
        }
        const data: FastMenuItemFromAPI[] = await response.json();
        
        // Group by productType.name
        const grouped: Record<string, FastMenuItemFromAPI[]> = {};
        data.forEach(item => {
          const typeName = item.productType.name;
          if (!grouped[typeName]) {
            grouped[typeName] = [];
          }
          grouped[typeName].push(item);
          // Sort items within each group by displayOrder
          grouped[typeName].sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
        });
        setFastMenuItemsByProductType(grouped);

      } catch (error) {
        console.error("Error fetching fast menu items:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        setFastMenuItemsError(errorMessage);
        toast.error("Chyba při načítání rychlých položek: " + errorMessage);
      } finally {
        setLoadingFastMenuItems(false);
      }
    };
    fetchFastMenu();
  }, [fetchedProductTypes]);

  const handleLogout = async () => {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (response.ok) {
      router.push('/login');
    } else {
      console.error("Logout failed");
      toast.error("Odhlášení se nezdařilo.");
    }
  };
  // --- Barcode Processing Logic ---
  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim()) {
      toast.info("Prosím, zadejte čárový kód.");
      return;
    }
    await processBarcode(barcode);
  };

  const processBarcode = async (barcode: string) => {
    setIsProcessingBarcode(true);
    setSelectedBillItemIndex(null); // Deselect item when new barcode is submitted
    try {
      // Check if barcode is a valid format before making the API call
      if (!barcode || barcode.trim() === '') {
        toast.error("Prosím, zadejte platný čárový kód.");
        return;
      }

      const response = await fetch(`/api/pos/product/barcode/${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        let errorMessageText = `Chyba serveru: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessageText = errorData.error;
          }
        } catch (jsonError) {
          console.warn("Could not parse error JSON from API", jsonError);
        }

        if (response.status === 404) {
          setNewProductBarcode(barcode);
          setIsProductFormOpen(true);
          toast.info(`Produkt s kódem "${barcode}" nebyl nalezen. Můžete ho nyní vytvořit.`);
        } else {
          toast.error(errorMessageText);
        }
        return; 
      }
      
      const productData: ProductFromAPI = await response.json();
      
      if (productData.amountType === 'KG') {
        setWeightEntryProductData(productData);
        setWeightEntryInputValue(""); // Reset input value for the dialog
        setIsWeightEntryDialogOpen(true);
      } else { // 'KS' or other types
        addOrUpdateProductInBill(productData, 1, false); // Add 1 quantity, not a final amount
      }
      setBarcodeInputValue(""); 
      // Focus the barcode input after processing
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 0);

    } catch (error) {
      console.error("Error processing barcode:", error);
      toast.error(error instanceof Error ? error.message : "Nastala chyba při zpracování kódu.");
    } finally {
      setIsProcessingBarcode(false);
    }
  };
  
  // --- Common function to add/update product in bill ---
  // Explicitly type addOrUpdateProductInBill for useCallback
  const addOrUpdateProductInBill: (productData: ProductFromAPI, newAmountVal: number, setAsFinalAmount: boolean) => void = useCallback((productData, newAmountVal, setAsFinalAmount) => {
    let itemAddedOrUpdatedDetails: ScannedItemData | null = null;
    let itemEffectivelyRemoved = false;
    let itemNameForToast = productData.name; // Use productData.name for consistent toast messages

    // Determine if the item was already in the bill *before* updating scannedItems
    const existingItemIndexOuter = scannedItems.findIndex(
        item => item.id === productData.id && item.amountType === productData.amountType
    );
    const itemWasAlreadyInBill = existingItemIndexOuter > -1;

    setScannedItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.id === productData.id && item.amountType === productData.amountType
      );
      let updatedItems;

      if (existingItemIndex > -1) {
        updatedItems = prevItems.map((item, index) => {
          if (index === existingItemIndex) {
            const currentAmount = item.amount;
            const updatedAmount = setAsFinalAmount ? newAmountVal : currentAmount + newAmountVal; // Should be const as it's not reassigned after this line
            itemNameForToast = item.name; // Use item's name if it exists

            if (updatedAmount <= 0) {
              if (item.amountType === 'KG') {
                toast.error("Váha KG položky nemůže být nula nebo záporná. Položka neupravena.");
                itemAddedOrUpdatedDetails = item; 
                return item;
              } else { // KS item, amount <= 0 means remove
                itemEffectivelyRemoved = true;
                return { ...item, amount: updatedAmount }; 
              }
            }
            const newItem = { ...item, amount: updatedAmount };
            itemAddedOrUpdatedDetails = newItem;
            return newItem;
          }
          return item;
        });

        if (itemEffectivelyRemoved) {
          updatedItems = updatedItems.filter(item => !(item.id === productData.id && item.amountType === productData.amountType && item.amount <= 0));
        }

      } else { 
        if (newAmountVal <= 0 && productData.amountType === 'KG') {
          toast.error("Váha pro novou KG položku musí být kladná.");
          return prevItems; 
        }
         if (newAmountVal <= 0 && productData.amountType === 'KS') {
          toast.error("Množství pro novou KS položku musí být kladné.");
          return prevItems; 
        }
        const newItemData: ScannedItemData = {
          id: productData.id,
          barcode: productData.barcode,
          name: productData.name,
          amount: newAmountVal,
          price: productData.price,
          productTypeId: productData.productTypeId,
          vatRate: productData.productType.vat.vat,
          amountType: productData.amountType, 
        };
        updatedItems = [...prevItems, newItemData];
        itemAddedOrUpdatedDetails = newItemData;
        itemNameForToast = newItemData.name; 
      }
      return updatedItems;
    });

    if (itemEffectivelyRemoved) {
        toast.info(`Položka ${itemNameForToast} odstraněna.`);
        if (lastScanned && lastScanned.id === productData.id && lastScanned.amountType === productData.amountType) {
            setLastScanned(null);
        }
        setSelectedBillItemIndex(null);
    } else if (itemAddedOrUpdatedDetails) { 
        const confirmedItem = itemAddedOrUpdatedDetails as ScannedItemData; // Explicit type assertion
        setLastScanned(confirmedItem);
        const unit = productData.amountType === 'KG' ? 'kg' : (productData.amountType === 'KS' ? 'ks' : '');
        const actionText = setAsFinalAmount ? 'nastaveno na' : (itemWasAlreadyInBill ? 'aktualizováno na' : 'přidáno:');
        const displayAmount = productData.amountType === 'KG' ? confirmedItem.amount.toFixed(3) : confirmedItem.amount.toFixed(0);
        toast.success(`${itemNameForToast} ${actionText} ${displayAmount}${unit}`);
        setSelectedBillItemIndex(null);
    }
  }, [lastScanned, scannedItems]);

  // --- Fast Menu Item Click Handler ---
  const handleFastMenuItemClick = (product: ProductFromAPI) => {
    setSelectedBillItemIndex(null); // Deselect item when fast menu item is clicked
    if (product.amountType === 'KG') {
      setWeightEntryProductData(product);
      setWeightEntryInputValue(""); // Reset input value for the dialog
      setIsWeightEntryDialogOpen(true);
    } else { // 'KS' or other types
      addOrUpdateProductInBill(product, 1, false); // Add 1 quantity, not a final amount
    }
  };

  const handleNumpadInput = (key: string) => {
    if (isProcessingBarcode && !['Clear', '+', 'ArrowUp', 'ArrowDown'].includes(key)) return;

    if (key >= '0' && key <= '9' || key === '.' || key === '00') {
      setBarcodeInputValue(prev => {
        if (key === '.' && prev.includes('.')) return prev;
        return prev + key;
      });
    } else if (key === 'Backspace') {
      setBarcodeInputValue(prev => prev.slice(0, -1));
    } else if (key === 'Clear' || key === 'Delete') {
      setBarcodeInputValue('');
      setSelectedBillItemIndex(null); // Also deselect item on clear
    } else if (key === '+') {
      // Handle + button click with amount from textbox
      const amountToSet = parseInt(barcodeInputValue.trim(), 10);
      
      if (isNaN(amountToSet) || amountToSet <= 0) {
        toast.error("Prosím, zadejte platné kladné číslo pro množství.");
        setBarcodeInputValue("");
        return;
      }

      if (selectedBillItemIndex !== null) {
        const selectedItem = scannedItems[selectedBillItemIndex];
        if (!selectedItem) {
          setBarcodeInputValue("");
          return;
        }

        if (selectedItem.amountType === 'KG') {
          toast.info(`Pro úpravu váhy KG položky "${selectedItem.name}" použijte Enter s novou váhou, nebo ji odstraňte a přidejte znovu.`);
        } else {
          setScannedItems(prevItems => {
            return prevItems.map((item, index) => {
              if (index === selectedBillItemIndex) {
                setLastScanned({ ...item, amount: amountToSet });
                toast.success(`Množství pro ${item.name} upraveno na ${amountToSet}.`);
                return { ...item, amount: amountToSet };
              }
              return item;
            });
          });
        }
        setBarcodeInputValue("");
        setSelectedBillItemIndex(null);
      } else if (lastScanned) {
        if (lastScanned.amountType === 'KG') {
          toast.info("Pro úpravu váhy KG položky ji nejprve vyberte v seznamu.");
        } else {
          setScannedItems(prevItems => {
            return prevItems.map(item => {
              if (item.id === lastScanned.id && item.barcode === lastScanned.barcode && item.amountType === 'KS') {
                setLastScanned({ ...item, amount: amountToSet });
                toast.success(`Množství pro ${item.name} upraveno na ${amountToSet}.`);
                return { ...item, amount: amountToSet };
              }
              return item;
            });
          });
        }
        setBarcodeInputValue("");
      } else {
        toast.info("Nejprve naskenujte nebo vyberte položku pro úpravu množství.");
      }
    } else if (key === 'Enter') {
      // Check if input contains "+" or "%2b" for quantity update
      if (barcodeInputValue.includes('+') || barcodeInputValue.includes('%2b')) {
        // Replace %2b with + for consistent handling
        const normalizedInput = barcodeInputValue.replace('%2b', '+');
        const [amountPart] = normalizedInput.split('+');
        const newAmount = parseInt(amountPart.trim(), 10);
        
        if (isNaN(newAmount) || newAmount < 0) {
          toast.error("Neplatné množství. Zadejte kladné celé číslo.");
          setBarcodeInputValue("");
          return;
        }

        if (selectedBillItemIndex !== null) {
          // Update selected item quantity
          const selectedItem = scannedItems[selectedBillItemIndex];
          if (!selectedItem) {
            setBarcodeInputValue("");
            return;
          }

          if (selectedItem.amountType === 'KG') {
            toast.info(`Pro úpravu váhy KG položky "${selectedItem.name}" použijte Enter s novou váhou, nebo ji odstraňte a přidejte znovu.`);
          } else {
            setScannedItems(prevItems => {
              return prevItems.map((item, index) => {
                if (index === selectedBillItemIndex) {
                  setLastScanned({ ...item, amount: newAmount });
                  toast.success(`Množství pro ${item.name} upraveno na ${newAmount}.`);
                  return { ...item, amount: newAmount };
                }
                return item;
              });
            });
          }
          setBarcodeInputValue("");
          setSelectedBillItemIndex(null);
        } else if (lastScanned) {
          // Update last scanned item quantity
          if (lastScanned.amountType === 'KG') {
            toast.info("Pro úpravu váhy KG položky ji nejprve vyberte v seznamu.");
          } else {
            setScannedItems(prevItems => {
              return prevItems.map(item => {
                if (item.id === lastScanned.id && item.barcode === lastScanned.barcode && item.amountType === 'KS') {
                  setLastScanned({ ...item, amount: newAmount });
                  toast.success(`Množství pro ${item.name} upraveno na ${newAmount}.`);
                  return { ...item, amount: newAmount };
                }
                return item;
              });
            });
          }
          setBarcodeInputValue("");
        } else {
          toast.info("Nejprve naskenujte nebo vyberte položku pro úpravu množství.");
        }
      } else {
        // If no "+" or "%2b" symbol, process as a new barcode
        handleBarcodeSubmit(barcodeInputValue);
      }
    } else if (key === 'ArrowUp') {
      if (scannedItems.length > 0) {
        setSelectedBillItemIndex(prevIndex => {
          if (prevIndex === null) {
            return scannedItems.length - 1;
          }
          return Math.max(0, prevIndex - 1);
        });
        setBarcodeInputValue("");
      }
    } else if (key === 'ArrowDown') {
      if (scannedItems.length > 0) {
        setSelectedBillItemIndex(prevIndex => {
          if (prevIndex === null) {
            return 0;
          }
          return Math.min(scannedItems.length - 1, prevIndex + 1);
        });
        setBarcodeInputValue("");
      }
    }
  };

  const handleOpenManualEntryDialog = (productType: FetchedProductType) => {
    setManualEntryProductType(productType);
    setManualEntryPrice(""); 
    setIsManualEntryDialogOpen(true);
  };

  const handleManualEntryConfirm = useCallback(() => { 
    if (!manualEntryProductType) return;

    const priceValue = parseFloat(manualEntryPrice.replace(',', '.'));
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error("Prosím, zadejte platnou kladnou cenu.");
      return;
    }

    // Ensure manualEntryProductType.vat is available due to updated FetchedProductType
    if (!manualEntryProductType.vat) {
        toast.error("Chyba: DPH pro typ produktu nebylo nalezeno.");
        return;
    }

    const newItem: ScannedItemData = {
      id: -manualEntryProductType.id, 
      barcode: `MANUAL_${manualEntryProductType.id}`, 
      name: `${manualEntryProductType.name} (Ruční)`, 
      amount: 1, // Manual entries are 1 KS by default
      price: priceValue,
      productTypeId: manualEntryProductType.id, // Store productTypeId
      vatRate: manualEntryProductType.vat.vat, // Store VAT rate from selected product type
      amountType: 'KS', // Manual entries default to KS
    };

    setScannedItems(prevItems => [...prevItems, newItem]);
    setLastScanned(newItem);
    toast.success(`Přidáno: ${newItem.name} za ${priceValue.toFixed(2)} Kč`);
    setIsManualEntryDialogOpen(false);
    setManualEntryPrice(""); 
  }, [manualEntryProductType, manualEntryPrice]); 

  const handleManualEntryNumpadInput = (key: string) => {
    setManualEntryPrice(prev => {
      if (key === '.' || key === ',') { // Allow both . and ,
        if (prev.includes('.') || prev.includes(',')) return prev;
        return prev + '.'; // Store with .
      }
      if (key === '00') {
        if (prev.includes('.')) {
            const parts = prev.split('.');
            if (parts[1] && parts[1].length >= 3) return prev; 
            if (parts[1] && parts[1].length === 2) return prev + '0';
            if (parts[1] && parts[1].length === 1) return prev + '00'; 
            if (parts[1] && parts[1].length === 0) return prev + '00'; 
        }
        return prev + key;
      }
      // Prevent multiple leading zeros unless it's "0." - Linter might flag these, but the logic is sound.
      if (key === '0' && prev === '0') return prev; // Simplified
      if (prev === '0' && !(key === '.' || key === ',') && key !== '0') return key; 

      // Limit total length if necessary, e.g., max 7 chars for weight "123.456"
      if (prev.length >= 7) return prev;

      return prev + key;
    });
  };

  useEffect(() => {
    const currentTotal = scannedItems.reduce((sum, item) => sum + item.price * item.amount, 0);
    setTotalAmount(currentTotal);
  }, [scannedItems]);

  // --- Pay Amount Dialog Logic ---
  const handleOpenPayAmountDialog = () => {
    if (scannedItems.length === 0) {
      toast.info("Nákupní seznam je prázdný.");
      return;
    }
    setAmountToPay(totalAmount);
    setPaidAmountInput("");
    setReturnAmount(0);
    setIsPayAmountDialogOpen(true);
  };

  const handlePayAmountNumpadInput = (key: string) => {
    setPaidAmountInput(prev => {
      if (key === '.' && prev.includes('.')) return prev;
      if (key === '00') {
        if (prev.includes('.')) {
            const parts = prev.split('.');
            if (parts[1] && parts[1].length >= 2) return prev;
            if (parts[1] && parts[1].length === 1) return prev + '0';
            if (parts[1] && parts[1].length === 0) return prev + '00';
        }
        return prev + key;
      }
      // For Backspace and Clear
      if (key === 'BackspaceExt') return prev.slice(0, -1);
      if (key === 'ClearExt') return "";
      
      return prev + key; // For numeric keys
    });
  };

  useEffect(() => {
    const paid = parseFloat(paidAmountInput);
    if (!isNaN(paid) && amountToPay > 0) {
      setReturnAmount(Math.max(0, paid - amountToPay));
    } else {
      setReturnAmount(0);
    }
  }, [paidAmountInput, amountToPay]);

  const handleConfirmAndEndOrder = async () => {
    const paidFloat = parseFloat(paidAmountInput);
    if (isNaN(paidFloat) || paidFloat < amountToPay) {
      toast.error("Zaplacená částka je nedostatečná.");
      return;
    }

    const orderPayload = {
      items: scannedItems, 
      paidAmount: paidFloat,
      returnAmount: returnAmount,
    };

    setPaidAmountForReceipt(paidFloat);
    setReturnAmountForReceipt(returnAmount);
    const now = new Date();
    setCurrentOrderDateForReceipt(now);
    setCurrentReceiptNumber(`POS-${formatDate(now, 'yyyyMMddHHmmss')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`);

    try {
      const response = await fetch('/api/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const result = await response.json();

      if (!response.ok) {
        let errorMessage = result.error || 'Nepodařilo se vytvořit objednávku.';
        if (result.details && result.details.fieldErrors) {
            // Example: take first error message if available
            const fieldErrors = result.details.fieldErrors;
            const firstErrorKey = Object.keys(fieldErrors)[0];
            if (firstErrorKey && fieldErrors[firstErrorKey] && fieldErrors[firstErrorKey].length > 0) {
                errorMessage = fieldErrors[firstErrorKey][0];
            }
        }
        toast.error(errorMessage);
        setPaidAmountForReceipt(undefined);
        setReturnAmountForReceipt(undefined);
        setCurrentOrderDateForReceipt(undefined);
        setCurrentReceiptNumber(undefined);
        return; 
      }
      
      if (result.orderCreated === false) {
        toast.info(result.message || "Objednávka nebyla vytvořena v databázi (např. pouze ruční položky).");
      } else {
        toast.success(result.message || `Objednávka #${result.orderId} úspěšně vytvořena! Vráceno: ${returnAmount.toFixed(2)} Kč`);
      }
      
      if (scannedItems.length > 0) {
        triggerPrint(); 
      }

      // Clear sessionStorage when order is completed
      sessionStorage.removeItem('posScannedItems');
      sessionStorage.removeItem('posLastScanned');

      setScannedItems([]);
      setLastScanned(null);
      setBarcodeInputValue("");
      setSelectedBillItemIndex(null);
      setIsPayAmountDialogOpen(false);
      setPaidAmountInput("");
      setReturnAmount(0);

    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Došlo k chybě při komunikaci se serverem.");
      setPaidAmountForReceipt(undefined);
      setReturnAmountForReceipt(undefined);
      setCurrentOrderDateForReceipt(undefined);
      setCurrentReceiptNumber(undefined);
    }
  };

  // --- Print Order Logic using react-to-print ---
  const triggerPrint = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: currentReceiptNumber || "Uctenka",
    onAfterPrint: () => {
      console.log('Tisk POS uctenky dokoncen.');
      setPaidAmountForReceipt(undefined);
      setReturnAmountForReceipt(undefined);
      setCurrentOrderDateForReceipt(undefined);
      setCurrentReceiptNumber(undefined);
    },
    onPrintError: (_errorLocation, error) => toast.error(`Chyba tisku: ${error.message}`)
  });

  // --- Weight Entry Dialog Handlers ---
  const handleWeightEntryConfirm = useCallback(() => {
    if (!weightEntryProductData) return;

    const weight = parseFloat(weightEntryInputValue.replace(',', '.'));
    if (isNaN(weight) || weight <= 0) {
      toast.error("Prosím, zadejte platnou kladnou váhu (např. 0.5).");
      return;
    }

    addOrUpdateProductInBill(weightEntryProductData, weight, true); 

    setIsWeightEntryDialogOpen(false);
    setWeightEntryProductData(null);
    setWeightEntryInputValue("");
    
    // Focus the barcode input after weight entry
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 0);
  }, [weightEntryProductData, weightEntryInputValue, addOrUpdateProductInBill]);

  const handleWeightDirectChange = (value: string) => {
    const sanitizedForDot = value.replace(',', '.');

    // Regex: allows empty string, or numbers with optional dot and up to 3 decimal places.
    // Allows "123", "123.", "123.456", "."
    const mainRegex = /^\d*\.?\d{0,3}$/;

    if (mainRegex.test(sanitizedForDot) || sanitizedForDot === "") {
      let finalValue = sanitizedForDot;

      // Handle leading "0"s if not "0." like "007" -> "7"
      // But allow "0.xxx"
      if (finalValue.length > 1 && finalValue.startsWith('0') && !finalValue.startsWith('0.')) {
          const numericPart = finalValue.split('.')[0];
          const decimalPart = finalValue.split('.')[1];
          const intVal = parseInt(numericPart, 10); // "007" -> 7
          finalValue = intVal.toString() + (decimalPart !== undefined ? '.' + decimalPart : (finalValue.endsWith('.') ? '.' : ''));
      }

      // If it starts with '.' (e.g., user typed '.5'), prepend '0'
      // This should happen after handling leading zeros to correctly form "0.xyz" from ".xyz"
      if (finalValue.startsWith('.') && finalValue.length > 0) {
        finalValue = '0' + finalValue;
      }
      
      // Max length for the entire string, e.g., 7 characters for "123.456"
      if (finalValue.length > 7) {
        finalValue = finalValue.substring(0, 7);
      }

      setWeightEntryInputValue(finalValue);
    }
    // If input doesn't match regex (e.g. "1.2.3", "abc", "1.2345"), value is not changed by this handler.
  };

  const handleWeightEntryNumpadInput = (key: string) => {
    setWeightEntryInputValue(prev => {
      if (key === '.' || key === ',') {
        if (prev.includes('.') || prev.includes(',')) return prev;
        return prev + '.'; // Standardize to . internally
      }
      if (key === '00') {
        if (prev.includes('.')) {
            const parts = prev.split('.');
            if (parts[1] && parts[1].length >= 3) return prev; 
            if (parts[1] && parts[1].length === 2) return prev + '0';
            if (parts[1] && parts[1].length === 1) return prev + '00'; 
            if (parts[1] && parts[1].length === 0) return prev + '00'; 
        }
        return prev + key;
      }
      // Prevent multiple leading zeros unless it's "0." - Linter might flag these, but the logic is sound.
      if (key === '0' && prev === '0') return prev; // Simplified
      if (prev === '0' && !(key === '.' || key === ',') && key !== '0') return key; 

      // Limit total length if necessary, e.g., max 7 chars for weight "123.456"
      if (prev.length >= 7) return prev;

      return prev + key;
    });
  };

  // --- Edit Price Dialog Handlers ---
  const handleOpenEditPriceDialog = useCallback(() => {
    if (selectedBillItemIndex !== null) {
      const selectedItem = scannedItems[selectedBillItemIndex];
      if (selectedItem) {
        setItemForPriceEdit(selectedItem);
        setNewPriceInputValue(selectedItem.price.toFixed(2));
        setIsEditPriceDialogOpen(true);
        return;
      }
    }
    
    if (lastScanned) {
      setItemForPriceEdit(lastScanned);
      setNewPriceInputValue(lastScanned.price.toFixed(2));
      setIsEditPriceDialogOpen(true);
      return;
    }

    toast.info("Vyberte položku v seznamu nebo naskenujte novou pro úpravu ceny.");
  }, [lastScanned, selectedBillItemIndex, scannedItems]);

  const handleEditPriceNumpadInput = (key: string) => {
    setNewPriceInputValue(prev => {
      if (key === '.' || key === ',') {
        if (prev.includes('.') || prev.includes(',')) return prev;
        return prev + '.'; // Store with .
      }
      if (key === '00') {
         // Allow '00' only if no decimal or if decimal exists and less than 2 decimal places
        if (prev.includes('.')) {
            const parts = prev.split('.');
            if (parts[1] && parts[1].length >= 2) return prev; // Max 2 decimal places for price
             if (parts[1] && parts[1].length === 1) return prev + '0'; // e.g. 1.1 -> 1.10
            if (parts[1] && parts[1].length === 0) return prev + '00'; // e.g. 1. -> 1.00
        }
        return prev + key; // e.g., 1 -> 100 or if empty -> 00
      }
      if (key === '0' && prev === '0' && !['.',','].includes(key)) return prev;
      if (prev === '0' && !['.',','].includes(key) && key !== '0') return key; // Replace leading '0' if not followed by decimal

      // Limit total length before decimal, e.g. 5 digits for price "12345.67"
      const mainPart = prev.split('.')[0];
      if (mainPart.length >= 5 && !prev.includes('.') && !['.',','].includes(key)) return prev;
      // Limit total length overall
      if (prev.length >= 8) return prev; // e.g. "12345.78"

      return prev + key;
    });
  };

  const handleNewPriceDirectChange = (value: string) => {
    const sanitizedValue = value.replace(',', '.');
    if (/^\d*\.?\d{0,2}$/.test(sanitizedValue) || sanitizedValue === "") {
      if (sanitizedValue.startsWith('00') && !sanitizedValue.startsWith('0.') && sanitizedValue.length > 1) {
        setNewPriceInputValue(sanitizedValue.substring(1)); 
      } else if (sanitizedValue.length > 1 && sanitizedValue.startsWith('.')) { // Prevent starting with just a dot
        setNewPriceInputValue('0' + sanitizedValue);
      } else if (sanitizedValue.length > 8 ) { // Limit overall length e.g. 12345.78 (8 chars)
        setNewPriceInputValue(prev => prev); // Keep previous value if too long
      } else {
        setNewPriceInputValue(sanitizedValue);
      }
    } else if (sanitizedValue === '.') { // Allow starting with a single dot, will be prefixed with 0
        setNewPriceInputValue('0.');
    }
  };

  const handleConfirmEditPrice = useCallback(() => {
    if (!itemForPriceEdit) return;

    const newPriceNum = parseFloat(newPriceInputValue.replace(',', '.'));
    if (isNaN(newPriceNum) || newPriceNum < 0) { // Allow 0 price if needed, though usually positive
      toast.error("Prosím, zadejte platnou nezápornou cenu.");
      return;
    }

    let itemUpdatedInBill = false;
    let updatedItemForLastScannedState: ScannedItemData | null = null;

    setScannedItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemForPriceEdit.id && item.barcode === itemForPriceEdit.barcode) {
          itemUpdatedInBill = true;
          const updatedVersion = { ...item, price: newPriceNum };
          if (lastScanned && lastScanned.id === itemForPriceEdit.id && lastScanned.barcode === itemForPriceEdit.barcode) {
            updatedItemForLastScannedState = updatedVersion;
          }
          return updatedVersion;
        }
        return item;
      })
    );

    if (itemUpdatedInBill) {
      if (updatedItemForLastScannedState) {
        setLastScanned(updatedItemForLastScannedState);
      }
      toast.success(`Cena pro ${itemForPriceEdit.name} upravena na ${newPriceNum.toFixed(2)} Kč.`);
    } else {
      // This case should ideally not be reached if itemForPriceEdit is always valid
      toast.info("Položka pro úpravu ceny nebyla v seznamu nalezena. Cena nebyla změněna.");
    }

    setIsEditPriceDialogOpen(false);
    setItemForPriceEdit(null);
    setNewPriceInputValue("");
  }, [itemForPriceEdit, newPriceInputValue, lastScanned, setScannedItems, setLastScanned]);

  const handleOpenProductTypeSelectionDialog = () => {
    setIsProductTypeSelectionDialogOpen(true);
  };

  const handleProductTypeSelectedForManualEntry = (productType: FetchedProductType) => {
    handleOpenManualEntryDialog(productType); // Re-use existing logic to open manual entry
    setIsProductTypeSelectionDialogOpen(false); // Close the selection dialog
  };

  // --- Event Handlers ---
  const handleGoToDashboard = () => {
    // Ensure state is saved before navigation
    try {
      sessionStorage.setItem('posScannedItems', JSON.stringify(scannedItems));
      sessionStorage.setItem('posLastScanned', JSON.stringify(lastScanned));
    } catch (error) {
      console.error('Error saving state before navigation:', error);
    }
    router.push('/dashboard');
  };

  // --- Event Handlers ---
  const handleProductSearchSelect = useCallback((product: UserProduct) => {
    const newScannedItem: ScannedItemData = {
      id: product.id,
      barcode: product.barcode || '',
      name: product.name,
      amount: 1,
      price: product.price,
      productTypeId: product.productTypeId,
      vatRate: product.productType?.vat.vat || 0,
      amountType: 'KS',
    };
    setScannedItems(prev => [...prev, newScannedItem]);
    setIsProductSearchModalOpen(false);
  }, [setScannedItems]);

  const handleProductFormSubmit = async (values: ProductFormValues) => {
    setIsSubmittingProduct(true);
    try {
      const response = await fetch('/api/dashboard/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const newProduct = await response.json();
      toast.success(`Produkt "${newProduct.name}" úspěšně vytvořen.`);

      // Add the newly created product to the bill
      const productData: ProductFromAPI = {
        id: newProduct.id,
        barcode: newProduct.barcode,
        name: newProduct.name,
        price: newProduct.price,
        amountType: newProduct.amountType,
        productTypeId: newProduct.productTypeId,
        productType: {
          id: newProduct.productType.id,
          name: newProduct.productType.name,
          vatId: newProduct.productType.vat.id,
          vat: {
            id: newProduct.productType.vat.id,
            name: newProduct.productType.vat.name,
            vat: newProduct.productType.vat.vat
          }
        },
        vat: {
          id: newProduct.productType.vat.id,
          name: newProduct.productType.vat.name,
          vat: newProduct.productType.vat.vat
        }
      };

      if (productData.amountType === 'KG') {
        setWeightEntryProductData(productData);
        setWeightEntryInputValue("");
        setIsWeightEntryDialogOpen(true);
      } else {
        addOrUpdateProductInBill(productData, 1, false);
      }

      setIsProductFormOpen(false);
      setBarcodeInputValue("");

      // Focus the barcode input after product creation
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 0);

    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(error instanceof Error ? error.message : "Nastala chyba při vytváření produktu.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 p-2 space-x-2">
      <BillSummaryColumn
        totalAmount={totalAmount}
        lastScanned={lastScanned}
        scannedItems={scannedItems}
        selectedBillItemIndex={selectedBillItemIndex}
        onSelectItem={setSelectedBillItemIndex}
        onGoToDashboard={handleGoToDashboard}
        onLogout={handleLogout}
        onOpenProductSearch={() => setIsProductSearchModalOpen(true)}
      />

      {/* Middle Column: Product Selection / Fast Menu - Replaced with Component */}
      <ProductSelectionColumn
        fetchedProductTypes={fetchedProductTypes}
        loadingProductTypes={loadingProductTypes}
        productTypesError={productTypesError}
        currentProductType={currentProductType}
        onSelectProductType={setCurrentProductType}
        fastMenuItemsByProductType={fastMenuItemsByProductType}
        loadingFastMenuItems={loadingFastMenuItems}
        fastMenuItemsError={fastMenuItemsError}
        onFastMenuItemClick={handleFastMenuItemClick}
      />

      {/* Right Column: Numpad & Actions - Replaced with Component */}
      <ActionsNumpadColumn
        barcodeInputValue={barcodeInputValue}
        onBarcodeInputChange={setBarcodeInputValue}
        onInputEnterKey={() => {
          // Check if input contains "+" or "%2b" for quantity update
          if (barcodeInputValue.includes('+') || barcodeInputValue.includes('%2b')) {
            // Replace %2b with + for consistent handling
            const normalizedInput = barcodeInputValue.replace('%2b', '+');
            const [, amountPart] = normalizedInput.split('+');
            const newAmount = parseInt(amountPart.trim(), 10);
            
            if (isNaN(newAmount) || newAmount < 0) {
              toast.error("Neplatné množství. Zadejte kladné celé číslo.");
              setBarcodeInputValue("");
              return;
            }

            if (selectedBillItemIndex !== null) {
              // Update selected item quantity
              const selectedItem = scannedItems[selectedBillItemIndex];
              if (!selectedItem) {
                setBarcodeInputValue("");
                return;
              }

              if (selectedItem.amountType === 'KG') {
                toast.info(`Pro úpravu váhy KG položky "${selectedItem.name}" použijte Enter s novou váhou, nebo ji odstraňte a přidejte znovu.`);
              } else {
                setScannedItems(prevItems => {
                  return prevItems.map((item, index) => {
                    if (index === selectedBillItemIndex) {
                      setLastScanned({ ...item, amount: newAmount });
                      toast.success(`Množství pro ${item.name} upraveno na ${newAmount}.`);
                      return { ...item, amount: newAmount };
                    }
                    return item;
                  });
                });
              }
              setBarcodeInputValue("");
              setSelectedBillItemIndex(null);
            } else if (lastScanned) {
              // Update last scanned item quantity
              if (lastScanned.amountType === 'KG') {
                toast.info("Pro úpravu váhy KG položky ji nejprve vyberte v seznamu.");
              } else {
                setScannedItems(prevItems => {
                  return prevItems.map(item => {
                    if (item.id === lastScanned.id && item.barcode === lastScanned.barcode && item.amountType === 'KS') {
                      setLastScanned({ ...item, amount: newAmount });
                      toast.success(`Množství pro ${item.name} upraveno na ${newAmount}.`);
                      return { ...item, amount: newAmount };
                    }
                    return item;
                  });
                });
              }
              setBarcodeInputValue("");
            } else {
              toast.info("Nejprve naskenujte nebo vyberte položku pro úpravu množství.");
            }
          } else if (selectedBillItemIndex !== null && barcodeInputValue.trim() !== "") {
            const newQuantity = parseInt(barcodeInputValue);
            if (!isNaN(newQuantity) && newQuantity > 0) {
              const currentItem = scannedItems[selectedBillItemIndex];
              if (currentItem) {
                setScannedItems(prev => prev.map((itm, idx) => idx === selectedBillItemIndex ? {...itm, amount: newQuantity} : itm));
                toast.success(`Množství pro ${currentItem.name} nastaveno na ${newQuantity}.`);
                if(lastScanned && lastScanned.id === currentItem.id && lastScanned.barcode === currentItem.barcode) {
                     setLastScanned({...currentItem, amount: newQuantity});
                }
                setSelectedBillItemIndex(null); // Deselect item after amount change
              }
              setBarcodeInputValue("");
              // Focus the barcode input after updating quantity
              setTimeout(() => {
                barcodeInputRef.current?.focus();
              }, 0);
            } else {
              toast.error("Zadejte platné kladné číslo pro množství.");
            }
          } else {
            handleBarcodeSubmit(barcodeInputValue);
          }
        }}
        isProcessingBarcode={isProcessingBarcode}
        onNumpadKeyClick={handleNumpadInput}
        onOpenPayAmountDialog={handleOpenPayAmountDialog}
        scannedItemsCount={scannedItems.length}
        selectedBillItemIndex={selectedBillItemIndex}
        onRemoveSelectedItem={() => {
          if (selectedBillItemIndex !== null) {
            const itemToRemove = scannedItems[selectedBillItemIndex];
            if (itemToRemove) {
              toast.info(`Položka ${itemToRemove.name} odstraněna.`);
              const newScannedItems = scannedItems.filter((_, idx) => idx !== selectedBillItemIndex);
              setScannedItems(newScannedItems);
              setSelectedBillItemIndex(null);
            }
          }
        }}
        onOpenEditPriceDialog={handleOpenEditPriceDialog}
        lastScannedItemId={lastScanned?.id ?? null}
        onOpenProductTypeSelectionDialog={handleOpenProductTypeSelectionDialog}
        onPrintOrder={() => { 
          if (scannedItems.length === 0) {
            toast.info("Účtenka je prázdná. Není co tisknout.");
            return;
          } 
          setPaidAmountForReceipt(undefined); 
          setReturnAmountForReceipt(undefined);
          setCurrentOrderDateForReceipt(new Date()); 
          setCurrentReceiptNumber(`ADHOC-${formatDate(new Date(), 'yyyyMMddHHmmss')}`);
          triggerPrint();
        }}
        barcodeInputRef={barcodeInputRef}
      />

      {/* Manual Price Entry Dialog - Replaced with Component */}
      <ManualEntryDialog
        isOpen={isManualEntryDialogOpen && manualEntryProductType !== null}
        onOpenChange={(open) => {
          setIsManualEntryDialogOpen(open);
          if (!open) {
            setManualEntryProductType(null); // Also clear the selected product type
            setManualEntryPrice("");
          }
        }}
        productType={manualEntryProductType} 
        entryPrice={manualEntryPrice}
        onNumpadInput={handleManualEntryNumpadInput}
        onConfirm={handleManualEntryConfirm}
        onClearEntryPrice={() => setManualEntryPrice("")}
        onBackspaceEntryPrice={() => setManualEntryPrice(prev => prev.slice(0, -1))}
      />

      {/* Pay Amount Dialog - Replaced with Component */}
      <PayAmountDialog
        isOpen={isPayAmountDialogOpen}
        onOpenChange={(open) => {
          setIsPayAmountDialogOpen(open);
          if (!open) {
            setPaidAmountInput(""); // Reset on close
          }
        }}
        amountToPay={amountToPay}
        paidAmountDisplay={paidAmountInput} // Pass current paidAmountInput for display
        returnAmount={returnAmount}
        onNumpadKeyProcess={handlePayAmountNumpadInput} // Parent handles appending numeric/dot/00
        onPaidAmountChange={setPaidAmountInput}
        onConfirm={handleConfirmAndEndOrder}
        onClearPaidAmount={() => handlePayAmountNumpadInput('ClearExt')} // Specific handler for clear
        onBackspacePaidAmount={() => handlePayAmountNumpadInput('BackspaceExt')} // Specific handler for backspace
      />

      {/* Weight Entry Dialog - New */}
      {isWeightEntryDialogOpen && weightEntryProductData && (
        <WeightEntryDialog
          isOpen={isWeightEntryDialogOpen}
          onOpenChange={(open: boolean) => {
            setIsWeightEntryDialogOpen(open);
            if (!open) {
              setWeightEntryProductData(null); // Clear product data on close
              setWeightEntryInputValue("");    // Clear input value on close
            }
          }}
          productName={weightEntryProductData?.name}
          weightValue={weightEntryInputValue}
          onNumpadInput={handleWeightEntryNumpadInput} // Handles 0-9, ., 00
          onConfirm={handleWeightEntryConfirm}
          onClearWeight={() => setWeightEntryInputValue("")}
          onBackspaceWeight={() => setWeightEntryInputValue(prev => prev.slice(0, -1))}
          onWeightChange={handleWeightDirectChange}
        />
      )}

      {/* Edit Price Dialog - New */}
      <EditPriceDialog
        isOpen={isEditPriceDialogOpen}
        onOpenChange={(open) => {
          setIsEditPriceDialogOpen(open);
          if (!open) {
            setItemForPriceEdit(null); // Clear item on close
            setNewPriceInputValue(""); // Clear input on close
          }
        }}
        item={itemForPriceEdit}
        newPrice={newPriceInputValue}
        onNumpadInput={handleEditPriceNumpadInput}
        onConfirm={handleConfirmEditPrice}
        onClearNewPrice={() => setNewPriceInputValue("")}
        onBackspaceNewPrice={() => setNewPriceInputValue(prev => prev.slice(0, -1))}
        onNewPriceDirectChange={handleNewPriceDirectChange}
      />

      {/* Product Type Selection Dialog - New */}
      <ProductTypeSelectionDialog
        isOpen={isProductTypeSelectionDialogOpen}
        onOpenChange={setIsProductTypeSelectionDialogOpen}
        productTypes={fetchedProductTypes} // Pass all fetched product types
        onSelectProductType={handleProductTypeSelectedForManualEntry}
        loadingProductTypes={loadingProductTypes}
      />

      {/* Product Search Modal - New */}
      <ProductSearchModal
        isOpen={isProductSearchModalOpen}
        onClose={() => setIsProductSearchModalOpen(false)}
        onProductSelect={handleProductSearchSelect}
      />

      {/* Product Creation Dialog */}
      <ProductForm
        isOpen={isProductFormOpen}
        setIsOpen={(open) => {
          setIsProductFormOpen(open);
          if (!open) {
            setNewProductBarcode(""); // Clear barcode when dialog is closed
          }
        }}
        product={newProductBarcode ? {
          name: '',
          barcode: newProductBarcode,
          price: 0,
          amountType: 'KS',
          productTypeId: fetchedProductTypes[0]?.id ?? 0
        } : null}
        productTypes={fetchedProductTypes.map(type => ({ id: type.id, name: type.name }))}
        onSubmit={handleProductFormSubmit}
        isSubmitting={isSubmittingProduct}
      />

      {/* Hidden div for printing the PosReceipt */}
      {scannedItems.length > 0 && (
        <div style={{ display: 'none' }}>
          <PosReceipt 
            ref={receiptPrintRef} 
            items={scannedItems} 
            totalAmount={totalAmount} 
            paidAmount={paidAmountForReceipt} 
            returnAmount={returnAmountForReceipt} 
            receiptNumber={currentReceiptNumber}
            orderDate={currentOrderDateForReceipt}
          />
        </div>
      )}
    </div>
  );
} 