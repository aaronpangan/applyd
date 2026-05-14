"use client";

import { IconArchive, IconTrash, IconX } from "@tabler/icons-react";

interface BulkActionBarProps {
  count: number;
  isArchived: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  count,
  isArchived,
  onArchive,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border-hair border-border bg-muted px-4 py-2.5">
      <span className="text-sm font-medium">{count} selected</span>
      <div className="flex-1" />
      {isArchived ? (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
        >
          <IconTrash size={13} stroke={1.75} />
          Delete permanently
        </button>
      ) : (
        <button
          type="button"
          onClick={onArchive}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border-hair border-border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-background/80"
        >
          <IconArchive size={13} stroke={1.75} />
          Archive
        </button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        <IconX size={14} stroke={2} />
      </button>
    </div>
  );
}
