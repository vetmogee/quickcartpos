"use client";

import { Button } from "@/components/ui/button";
import React from "react";

interface NumpadProps {
  onInput: (key: string) => void;
  disabled?: boolean; // To disable the whole numpad
  disabledKeys?: string[]; // To disable specific keys
}

const numpadKeys = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '00'],
];

const Numpad: React.FC<NumpadProps> = ({ onInput, disabled = false, disabledKeys = [] }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {numpadKeys.flat().map((key) => (
        <Button
          key={key}
          variant="outline"
          className="h-16 text-xl active:bg-gray-300 dark:active:bg-gray-600" // Adjusted active style for dark mode
          onClick={() => onInput(key)}
          disabled={disabled || disabledKeys.includes(key)}
        >
          {key}
        </Button>
      ))}
    </div>
  );
};

export default Numpad; 