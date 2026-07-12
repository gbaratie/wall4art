import { useEffect, useRef, useState } from 'react';
import { Input, Label } from '@/components/ui';
import { api, type GeocodedAddress } from '@/lib/types';

type AddressFields = {
  address: string;
  city: string;
  postalCode: string;
};

export function AddressAutocomplete({
  value,
  onChange,
  required,
}: {
  value: AddressFields;
  onChange: (value: AddressFields) => void;
  required?: boolean;
}) {
  const [query, setQuery] = useState(value.address);
  const [suggestions, setSuggestions] = useState<GeocodedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value.address);
  }, [value.address]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const results = await api.searchAddresses(query);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setOpen(results.length > 0);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (suggestion: GeocodedAddress) => {
    onChange({
      address: suggestion.address,
      city: suggestion.city,
      postalCode: suggestion.postalCode,
    });
    setQuery(suggestion.address);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative">
        <Label>Adresse</Label>
        <Input
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange({ ...value, address: next });
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Ex. 12 rue de la République"
          required={required}
          autoComplete="street-address"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {suggestions.map((suggestion) => (
              <li key={`${suggestion.label}-${suggestion.latitude}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  {suggestion.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {loading && <p className="mt-1 text-xs text-slate-500">Recherche d&apos;adresses...</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Ville</Label>
          <Input
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            required={required}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <Label>Code postal</Label>
          <Input
            value={value.postalCode}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            required={required}
            autoComplete="postal-code"
          />
        </div>
      </div>
    </div>
  );
}
