"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CUSTOM_LABEL = "Yang lain:";
const CUSTOM_VALUE = "__CUSTOM__";

interface ComboboxFieldProps {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  customPlaceholder?: string;
  required?: boolean;
}

export function ComboboxField({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  customPlaceholder = "Ketik pilihan lain...",
  required,
}: ComboboxFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [customMode, setCustomMode] = React.useState(() => value !== "" && !options.includes(value));

  // Sync customMode if the parent value changes from outside.
  React.useEffect(() => {
    setCustomMode(value !== "" && !options.includes(value));
  }, [value, options]);

  const isCustom = customMode;
  const displayValue = isCustom ? CUSTOM_VALUE : value;

  function handleSelect(selected: string) {
    if (selected === CUSTOM_VALUE) {
      setCustomMode(true);
      onChange("");
    } else {
      setCustomMode(false);
      onChange(selected);
    }
    setOpen(false);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-9 w-full justify-between px-3 py-2 text-sm font-normal"
          >
            <span className="truncate">
              {displayValue
                ? displayValue === CUSTOM_VALUE
                  ? CUSTOM_LABEL
                  : displayValue
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Cari..." />
            <CommandList>
              <CommandEmpty>Tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => handleSelect(opt === CUSTOM_LABEL ? CUSTOM_VALUE : opt)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        displayValue === (opt === CUSTOM_LABEL ? CUSTOM_VALUE : opt) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{opt}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isCustom && (
        <Input
          id={`${id}-custom`}
          required={required}
          value={value}
          onChange={handleCustomChange}
          placeholder={customPlaceholder}
          className="mt-2"
        />
      )}
    </div>
  );
}

