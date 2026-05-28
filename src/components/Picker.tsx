"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PickerItem = {
  /** Unique key */
  id: string;
  /** Main label (displayed) */
  label: string;
  /** Searchable text (extends label) */
  search?: string;
  /** Optional right-aligned badge / suffix */
  badge?: string;
  /** Optional leading icon node */
  icon?: ReactNode;
  /** Arbitrary payload returned to onChange */
  payload?: unknown;
};

export type PickerGroup = {
  /** Group heading shown above items (e.g. "EVM", "OTHER ECOSYSTEMS") */
  label: string;
  items: PickerItem[];
};

export interface PickerProps {
  /** Currently selected id (controlled) */
  value: string;
  /** Groups to render (or pass `items` for ungrouped) */
  groups?: PickerGroup[];
  items?: PickerItem[];
  /** Trigger label override (defaults to selected item label) */
  triggerLabel?: ReactNode;
  /** Aria label / tooltip */
  ariaLabel?: string;
  /** Placeholder when no selection */
  placeholder?: string;
  /** Show search box (default true if >8 items) */
  searchable?: boolean;
  /** Selected handler */
  onChange: (id: string, payload?: unknown) => void;
  /** Class on trigger button */
  className?: string;
  /** Popup width override (px). Default = match trigger. */
  popupMinWidth?: number;
  /** Disabled */
  disabled?: boolean;
}

/**
 * Vectorheart-themed combobox/select.
 * - Click trigger → popup below
 * - Type to filter (when searchable)
 * - ↑/↓ navigates, Enter selects, Esc closes
 * - Click-outside closes
 *
 * Styled via the `.vc-picker-*` primitives in globals.css.
 */
export function Picker({
  value,
  groups,
  items,
  triggerLabel,
  ariaLabel,
  placeholder = "Select…",
  searchable,
  onChange,
  className = "",
  popupMinWidth,
  disabled,
}: PickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const normalizedGroups: PickerGroup[] = useMemo(() => {
    if (groups && groups.length > 0) return groups;
    if (items && items.length > 0) return [{ label: "", items }];
    return [];
  }, [groups, items]);

  const allItems = useMemo(
    () => normalizedGroups.flatMap((g) => g.items),
    [normalizedGroups],
  );
  const selected = allItems.find((i) => i.id === value) ?? null;
  const autoSearchable = searchable ?? allItems.length > 8;

  // Filter once per query
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return normalizedGroups;
    const q = query.trim().toLowerCase();
    return normalizedGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.label.toLowerCase().includes(q) ||
            it.search?.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [normalizedGroups, query]);

  const flatFiltered = useMemo(
    () => filteredGroups.flatMap((g) => g.items),
    [filteredGroups],
  );

  // Reset highlight when filter changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  // Click-outside + Esc
  useEffect(() => {
    if (!open) return;
    let armed = false;
    const arm = setTimeout(() => {
      armed = true;
    }, 0);
    const onDown = (e: MouseEvent) => {
      if (!armed) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(arm);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open && autoSearchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open, autoSearchable]);

  // Scroll active item into view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const commit = useCallback(
    (idx: number) => {
      const it = flatFiltered[idx];
      if (!it) return;
      onChange(it.id, it.payload);
      setOpen(false);
      setQuery("");
    },
    [flatFiltered, onChange],
  );

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(activeIdx);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        className="vc-picker-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">
          {triggerLabel ?? selected?.label ?? (
            <span style={{ color: "var(--vc-text-faint)" }}>{placeholder}</span>
          )}
        </span>
        <span className="vc-picker-btn__chev" aria-hidden>▼</span>
      </button>

      {open && (
        <div
          className="vc-picker-pop"
          style={{
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            minWidth: popupMinWidth,
          }}
          role="listbox"
          onKeyDown={onListKey}
          tabIndex={-1}
        >
          {autoSearchable && (
            <input
              ref={searchRef}
              type="text"
              placeholder="// SEARCH"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onListKey}
              className="vc-picker-pop__search"
              autoComplete="off"
              spellCheck={false}
            />
          )}
          <div ref={listRef} className="vc-picker-pop__list">
            {filteredGroups.length === 0 && (
              <div
                className="vc-mono"
                style={{
                  padding: "16px 14px",
                  fontSize: 11,
                  color: "var(--vc-text-mute)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                No matches.
              </div>
            )}
            {filteredGroups.map((g) => {
              let groupStart = 0;
              // compute the global index offset for each item
              return (
                <div key={g.label || "g"}>
                  {g.label && (
                    <div className="vc-picker-pop__group">{g.label}</div>
                  )}
                  {g.items.map((it) => {
                    const gIdx = flatFiltered.indexOf(it);
                    groupStart = gIdx;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        data-idx={gIdx}
                        data-active={gIdx === activeIdx}
                        data-selected={it.id === value}
                        className="vc-picker-pop__item"
                        onMouseEnter={() => setActiveIdx(gIdx)}
                        onClick={() => commit(gIdx)}
                      >
                        {it.icon && <span aria-hidden>{it.icon}</span>}
                        <span className="truncate">{it.label}</span>
                        {it.badge && (
                          <span className="vc-picker-pop__item__badge">
                            {it.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {/* swallow unused var */}
                  <span hidden>{groupStart}</span>
                </div>
              );
            })}
          </div>
          <div
            className="vc-mono"
            style={{
              padding: "6px 12px",
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "var(--vc-text-faint)",
              textTransform: "uppercase",
              borderTop: "1px solid var(--vc-line)",
              background: "var(--vc-ink-1)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>↑↓ navigate · ↵ select</span>
            <span>esc</span>
          </div>
        </div>
      )}
    </div>
  );
}
