"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Chevron } from "@/components/hud";

export type PickerItem = {
  id: string;
  label: string;
  search?: string;
  badge?: string;
  icon?: ReactNode;
  payload?: unknown;
};

export type PickerGroup = { label: string; items: PickerItem[] };

export interface PickerProps {
  value: string;
  groups?: PickerGroup[];
  items?: PickerItem[];
  triggerLabel?: ReactNode;
  ariaLabel?: string;
  sheetTitle?: string;
  placeholder?: string;
  searchable?: boolean;
  onChange: (id: string, payload?: unknown) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Desktop = popover under trigger. Mobile = portal-rendered bottom sheet.
 * Keyboard nav, searchable when > 8 items, body-scroll-lock on sheet.
 */
export function Picker({
  value,
  groups,
  items,
  triggerLabel,
  ariaLabel,
  sheetTitle = "Select",
  placeholder = "Select…",
  searchable,
  onChange,
  className = "",
  disabled,
}: PickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

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

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return normalizedGroups;
    const q = query.trim().toLowerCase();
    return normalizedGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) => it.label.toLowerCase().includes(q) || it.search?.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [normalizedGroups, query]);

  const flatFiltered = useMemo(
    () => filteredGroups.flatMap((g) => g.items),
    [filteredGroups],
  );

  useEffect(() => { setActiveIdx(0); }, [query, open]);

  useEffect(() => {
    if (!open || isMobile) return;
    let armed = false;
    const arm = setTimeout(() => { armed = true; }, 0);
    const onDown = (e: MouseEvent) => {
      if (!armed) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(arm);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!(open && isMobile)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (open && autoSearchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open, autoSearchable]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-idx="${activeIdx}"]`);
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

  const Pop = (
    <>
      {isMobile && (
        <div
          className="vh-picker-pop__backdrop"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <div
        className="vh-picker-pop"
        role="listbox"
        onKeyDown={onListKey}
        tabIndex={-1}
      >
        <div className="vh-picker-pop__handle" aria-hidden />
        {isMobile && (
          <div
            style={{
              padding: "4px 14px 8px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--vh-text-3)",
            }}
          >
            {sheetTitle}
          </div>
        )}
        {autoSearchable && (
          <input
            ref={searchRef}
            type="text"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onListKey}
            className="vh-picker-pop__search"
            autoComplete="off"
            spellCheck={false}
          />
        )}
        <div ref={listRef} className="vh-picker-pop__list">
          {filteredGroups.length === 0 && (
            <div
              style={{
                padding: "16px 14px",
                fontSize: 13,
                color: "var(--vh-text-3)",
                fontFamily: "var(--font-mono)",
              }}
            >
              No matches.
            </div>
          )}
          {filteredGroups.map((g) => (
            <div key={g.label || "g"}>
              {g.label && <div className="vh-picker-pop__group">{g.label}</div>}
              {g.items.map((it) => {
                const gIdx = flatFiltered.indexOf(it);
                return (
                  <button
                    key={it.id}
                    type="button"
                    data-idx={gIdx}
                    data-active={gIdx === activeIdx}
                    data-selected={it.id === value}
                    className="vh-picker-pop__item"
                    onMouseEnter={() => setActiveIdx(gIdx)}
                    onClick={() => commit(gIdx)}
                  >
                    {it.icon && <span aria-hidden>{it.icon}</span>}
                    <span className="vh-picker-pop__item__label">{it.label}</span>
                    {it.badge && (
                      <span className="vh-picker-pop__item__badge">{it.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        className="vh-picker-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="vh-picker-btn__label">
          {triggerLabel ?? selected?.label ?? (
            <span style={{ color: "var(--vh-text-4)" }}>{placeholder}</span>
          )}
        </span>
        <Chevron size={14} dir="down" />
      </button>

      {open && !isMobile && Pop}
      {open && isMobile && typeof document !== "undefined" &&
        createPortal(Pop, document.body)}
    </div>
  );
}
