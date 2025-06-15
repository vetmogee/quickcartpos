import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

// Zod schema for individual items in the order
const OrderItemSchema = z.object({
  id: z.number(), // Product ID from DB or -productTypeId for manual
  barcode: z.string(),
  name: z.string(),
  amount: z.number().positive('Množství musí být kladné číslo.'),
  price: z.number(),
  productTypeId: z.number(),
  vatRate: z.number().min(0, 'DPH sazba nemůže být záporná.'),
});

// Zod schema for the incoming request body
const CreateOrderRequestSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'Objednávka musí obsahovat alespoň jednu položku.'),
  paidAmount: z.number().min(0, 'Zaplacená částka nemůže být záporná.'),
  returnAmount: z.number().min(0, 'Vrácená částka nemůže být záporná.'),
});

// interface ScannedItemDataForAPI {  // Removed as it's unused
//   id: number;
//   barcode: string;
//   name: string;
//   amount: number;
//   price: number;
//   productTypeId: number;
//   vatRate: number;
// }

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.user) {
    return NextResponse.json({ error: authResult.error || 'Authentication failed' }, { status: 401 });
  }
  const userId = parseInt(authResult.user.userId, 10);

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error); // Log the error
    return NextResponse.json({ error: 'Invalid request body: Not valid JSON' }, { status: 400 });
  }
  
  const validation = CreateOrderRequestSchema.safeParse(requestBody);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid request data', details: validation.error.flatten() }, { status: 400 });
  }

  const { items, paidAmount, returnAmount } = validation.data;

  // Filter out manual items (id < 0) and prepare items for DB
  const itemsToPersist = items.filter(item => item.id > 0);

  if (itemsToPersist.length === 0 && items.length > 0) {
    // If all items were manual, we can't create an order with OrderItems based on current schema
    // For now, let's return a message. A more robust solution might log this differently.
     return NextResponse.json({ 
        message: 'Objednávka obsahuje pouze ruční položky, které nelze uložit do databáze v této verzi.',
        orderCreated: false 
    }, { status: 200 }); // Or 400 if this is considered an invalid order for persistence
  }
  
  // If after filtering, there are no items to persist (and there were items to begin with)
  // and if the original items list was not empty, it means all items were manual.
  // If the original list was empty, Zod validation would have caught it.
  // So, if itemsToPersist is empty here, it means all items were manual.

  let orderSubTotal = 0;
  let orderVatTotal = 0;

  const orderItemsToCreate = itemsToPersist.map(item => {
    const totalItemPrice = item.price * item.amount;
    // Price is assumed to be with VAT. VAT amount = Total - (Total / (1 + VAT_Rate/100))
    const itemVatAmount = totalItemPrice - (totalItemPrice / (1 + item.vatRate / 100));
    const itemSubTotal = totalItemPrice - itemVatAmount;

    orderSubTotal += itemSubTotal;
    orderVatTotal += itemVatAmount;

    return {
      productId: item.id, // Actual product ID
      quantity: item.amount,
      priceAtTime: item.price, // Price per unit at time of sale
      dphAtTime: item.vatRate, // VAT rate at time of sale
    };
  });
  
  const orderGrandTotal = orderSubTotal + orderVatTotal;

  // Basic check: paid amount should not be less than the backend-calculated total for persisted items
  // Frontend total might differ if it included manual items not persisted here.
  if (paidAmount < orderGrandTotal && itemsToPersist.length > 0) {
      // This check can be tricky if frontend total (used for payment) included manual items
      // and backend total (for persisted items) is now less.
      // For now, we trust the frontend handled payment correctly against its total.
      // A warning could be logged if paidAmount seems off for orderGrandTotal.
  }


  try {
    if (itemsToPersist.length === 0) {
        // This case implies original items might have only contained manual entries.
        // If no items are persisted, we shouldn't create an empty order.
        // The previous check for (itemsToPersist.length === 0 && items.length > 0) handles this.
        // If items array was initially empty, zod catches it. So this specific block might be redundant
        // if the above logic is sound.
        // For safety, if we somehow reach here with no items to persist, let's avoid creating an order.
        return NextResponse.json({ 
            message: 'Žádné položky k uložení do objednávky.', 
            orderCreated: false 
        }, { status: 200 });
    }


    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: userId,
          orderDate: new Date(),
          subTotal: parseFloat(orderSubTotal.toFixed(2)),
          dphTotal: parseFloat(orderVatTotal.toFixed(2)),
          total: parseFloat(orderGrandTotal.toFixed(2)),
          paidAmount: paidAmount,
          returnAmount: returnAmount,
          // We could also store paidAmount and changeGiven if the schema supports it
        },
      });

      await tx.orderItem.createMany({
        data: orderItemsToCreate.map(item => ({
          ...item,
          orderId: order.id,
        })),
      });

      return order;
    });

    return NextResponse.json({ 
        message: 'Objednávka úspěšně vytvořena.', 
        orderId: newOrder.id,
        orderCreated: true 
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating order:", error);
    let errorMessage = "Došlo k chybě při vytváření objednávky.";
    if (error instanceof z.ZodError) {
        errorMessage = "Chyba validace dat."; // Should be caught earlier
    } else if (error instanceof Error && error.message.includes("Foreign key constraint failed")) {
        errorMessage = "Chyba při propojování dat: Jeden nebo více produktů neexistuje.";
    }
    return NextResponse.json({ error: errorMessage, details: error instanceof Error ? error.message : null }, { status: 500 });
  }
} 