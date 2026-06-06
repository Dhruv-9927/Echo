import { Search } from 'lucide-react';
import './SearchInput.css';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div className="search-input">
      <Search className="search-input__icon" size={20} />
      <input 
        type="text" 
        className="search-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
