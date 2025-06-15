import React from 'react';
import Barcode from 'react-barcode';

interface ProductLabelProps {
  name: string;
  amountType: string;
  price: number;
  barcode: string;
}

// eslint-disable-next-line react/display-name
export const ProductLabel = React.forwardRef<HTMLDivElement, ProductLabelProps>(({ name, amountType, price, barcode }, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-white w-[300px] h-[150px] text-black flex flex-col p-1 border border-gray-400 rounded-lg shadow-md"
    >
      {/* Name Section */}
      <div 
        className="h-[46px] p-2 m-1 border border-gray-300 rounded-md flex items-center justify-center text-xl font-bold text-center"
      >
        {name}
      </div>

      {/* Bottom Section (Amount Type, Barcode & Price) */}
      <div className="flex flex-row flex-grow m-1 space-x-1"> {/* Container for the two bottom boxes */}
        
        {/* Left Column (for Amount Type and Barcode) */}
        <div className="w-[116px] flex flex-col space-y-1"> {/* Fixed width, column flow */}
          {/* Amount Type Box */}
          <div 
            className="h-[40px] p-1 border border-gray-300 rounded-md flex items-center justify-center text-lg"
          >
            {amountType}
          </div>
          {/* Barcode Box */}
          <div 
            className="flex-grow p-1 border border-gray-300 rounded-md flex flex-col items-center justify-center"
          >
            <Barcode 
              value={barcode} 
              format="CODE128"
              width={1} 
              height={20} 
              displayValue={true}
              margin={0}
              fontSize={10}
            />
          </div>
        </div>

        {/* Price Section (Right) */}
        <div 
          className="flex-grow p-2 border border-gray-300 rounded-md flex items-center justify-center text-2xl font-semibold"
        >
          {price.toFixed(2)} Kč
        </div>
      </div>
    </div>
  );
}); 