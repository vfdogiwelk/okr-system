"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Pencil } from "lucide-react";

export function InlineEdit({ value, onSave, className = "", placeholder = "Натисніть щоб редагувати...", multiline = false, tag: Tag = "span" }: {
  value: string; onSave: (val: string) => Promise<void>; className?: string; placeholder?: string; multiline?: boolean; tag?: "h2" | "span" | "p";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select(); } }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  function save() {
    if (draft.trim() && draft !== value) {
      startTransition(async () => { await onSave(draft.trim()); setEditing(false); });
    } else { setDraft(value); setEditing(false); }
  }

  if (editing) {
    const props = {
      value: draft, onChange: (e: any) => setDraft(e.target.value), onBlur: save,
      onKeyDown: (e: any) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); } if (e.key === "Escape") { setDraft(value); setEditing(false); } },
      className: `${className} bg-white border-2 border-[#6c5ce7] rounded-lg px-3 py-2 w-full focus:outline-none shadow-sm`,
      disabled: isPending,
    };
    return multiline ? <textarea ref={ref as any} rows={3} {...props} /> : <input ref={ref as any} type="text" {...props} />;
  }

  return (
    <Tag onClick={() => setEditing(true)} className={`${className} ${!value ? "text-gray-300 italic" : ""} editable-hover inline-block group cursor-text`}>
      {value || placeholder}
      <Pencil className="w-3.5 h-3.5 text-transparent group-hover:text-[#6c5ce7] inline ml-2 transition-colors" />
    </Tag>
  );
}
