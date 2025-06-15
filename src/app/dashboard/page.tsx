"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';

// Import the new tab components
import { SalesTab } from '@/components/dashboard/SalesTab';
import { OrdersTab } from '@/components/dashboard/OrdersTab';
import { ProductsTab } from '@/components/dashboard/ProductsTab';
import FastMenuTab from "@/components/dashboard/FastMenuTab";
import { ScrollArea } from '@radix-ui/react-scroll-area';

const tabOptions = [
  { value: "sales", label: "Přehled Prodeje" },
  { value: "orders", label: "Historie Objednávek" },
  { value: "products", label: "Správa Produktů" },
  { value: "fast-menu", label: "Správa Rychlého Menu" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(tabOptions[0].value);

  return (
    <ScrollArea className="max-h-[100%] overflow-y-auto">
    <div className="min-h-screen bg-gradient-to-b from-gray-300 to-white">
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Přehled</h1>
          <Button onClick={() => router.push('/pos')} variant="outline">
             Zpět do POS
           </Button>
        </div>

        <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 bg-gray-225">
            <TabsTrigger value="sales" className="data-[state=active]:bg-white">Přehled prodejů</TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-white">Historie objednávek</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-white">Správa produktů</TabsTrigger>
            <TabsTrigger value="fast-menu" className="data-[state=active]:bg-white">Správa rychlého menu</TabsTrigger>
          </TabsList>

          {/* --- Sales Overview Tab --- */}
          <TabsContent value="sales">
            <SalesTab isActive={activeTab === 'sales'} />
          </TabsContent>

          {/* --- Order History Tab --- */}
          <TabsContent value="orders">
            <OrdersTab isActive={activeTab === 'orders'} />
          </TabsContent>

          {/* --- Product Management Tab --- */}
          <TabsContent value="products" className="space-y-6">
            <ProductsTab isActive={activeTab === 'products'} />
          </TabsContent>

          {/* --- Fast Menu Tab --- */}
          <TabsContent value="fast-menu">
            <FastMenuTab isActive={activeTab === 'fast-menu'} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
    </ScrollArea>
  );
} 