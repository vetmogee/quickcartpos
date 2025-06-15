"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string // This will be the IČO
  label: string // This will be "IČO – Company Name"
}

interface ComboboxProps {
  inputValue: string // Current IČO in the input
  onInputChange: (val: string) => void // Called when input changes to trigger search
  options: ComboboxOption[] // Options from ARES search (IČO and Name)
  onOptionSelect: (option: ComboboxOption) => void // Called when an IČO is selected
  placeholder?: string
  loading?: boolean
  className?: string
}

export function Combobox({
  inputValue,
  onInputChange,
  options,
  onOptionSelect,
  placeholder,
  loading,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    // Keep the internal search state in sync with the parent's inputValue (IČO)
    // This allows the parent to control the displayed IČO if needed
    setSearch(inputValue)
  }, [inputValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-14 text-xl px-5 py-3 rounded-lg",
            className
          )}
        >
          {inputValue || placeholder || "Zadejte IČO..."} 
          <ChevronsUpDown className="ml-2 h-6 w-6 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[250px] p-0">
        <Command>
          <CommandInput
            value={search} // Controlled by internal search state
            onValueChange={(val) => {
              setSearch(val) // Update internal search state
              onInputChange(val) // Trigger search in parent
            }}
            placeholder={placeholder || "Hledat IČO..."}
            className="h-14 text-xl px-5 py-3"
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-4 text-lg">
                <Loader2 className="animate-spin mr-2 h-6 w-6" /> Načítání...
              </div>
            )}
            {!loading && options.length === 0 && search.length >= 3 && (
              <CommandEmpty>Žádné výsledky pro &quot;{search}&quot;</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value} // IČO is the key
                  value={option.value} // IČO is the value for filtering
                  onSelect={() => {
                    onOptionSelect(option) // Pass the full option (IČO and Label)
                    setOpen(false)
                    // setSearch(option.value) // Optionally keep IČO in search after select
                  }}
                  className="text-xl h-14 px-5 py-3 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-6 w-6",
                      inputValue === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label} {/* Display "IČO – Company Name" */}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
