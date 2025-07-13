import React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface PercentageInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}

export function PercentageInput({ value, onChange, placeholder, className, ...props }: PercentageInputProps) {
  const [displayValue, setDisplayValue] = React.useState(value?.toString() || '');

  React.useEffect(() => {
    setDisplayValue(value?.toString() || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    if (inputValue === '') {
      onChange(undefined);
      return;
    }

    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="relative">
      <Input
        {...props}
        type="number"
        step="0.01"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("pr-8", className)}
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
    </div>
  );
}
