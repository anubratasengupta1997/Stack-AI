import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (nextSelected: string[]) => void;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAllSelected =
    options.length > 0 && selected.length === options.length;

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getSummaryText = () => {
    if (selected.length === 0) return 'None selected';
    if (isAllSelected) return `All (${options.length})`;
    if (selected.length === 1) return selected[0];
    return `${selected.length} of ${options.length} selected`;
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-slate-600 mb-1.5 whitespace-nowrap">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
          !isAllSelected && selected.length > 0
            ? 'bg-slate-900 text-white border-slate-900'
            : selected.length === 0
              ? 'bg-amber-50/70 text-amber-900 border-amber-300'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="truncate font-mono">{getSummaryText()}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-2 left-0">
          {options.length > 5 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
              />
            </div>
          )}

          <div className="flex items-center justify-between px-1.5 py-1 mb-1 border-b border-slate-100 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-slate-700 hover:text-slate-950 font-medium whitespace-nowrap shrink-0"
            >
              Select All ({options.length})
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-500 hover:text-rose-700 font-medium whitespace-nowrap shrink-0"
            >
              Clear
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                No matching options
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isChecked = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-slate-50 transition-colors"
                  >
                    <span
                      className={`truncate ${
                        isChecked
                          ? 'font-medium text-slate-900'
                          : 'text-slate-600'
                      }`}
                    >
                      {option}
                    </span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
