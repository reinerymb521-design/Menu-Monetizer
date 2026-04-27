import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="glass-panel flex items-center gap-2 px-4 py-2.5">
      <Search className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        type="text"
        placeholder="Buscar en el universo..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
    </div>
  );
}
