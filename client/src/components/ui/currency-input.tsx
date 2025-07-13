import React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
}

export function CurrencyInput({ value, onChange, placeholder, className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState(value ? value.toLocaleString('en-CA') : '');

  React.useEffect(() => {
    setDisplayValue(value ? value.toLocaleString('en-CA') : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove formatting to get raw number
    const numericValue = inputValue.replace(/[^0-9.]/g, '');
    
    if (numericValue === '') {
      setDisplayValue('');
      onChange(undefined);
      return;
    }

    const parsed = parseFloat(numericValue);
    if (!isNaN(parsed)) {
      setDisplayValue(parsed.toLocaleString('en-CA'));
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (value) {
      setDisplayValue(value.toLocaleString('en-CA'));
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
      <Input
        {...props}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn("pl-8", className)}
      />
    </div>
  );
}
