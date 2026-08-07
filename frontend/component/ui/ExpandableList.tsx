"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface ExpandableListProps<T> {
  items: T[];
  initialCount?: number;
  renderItem?: (item: T, index: number) => React.ReactNode;
  children?: (visibleItems: T[], isExpanded: boolean) => React.ReactNode;
  showMoreLabel?: string;
  showLessLabel?: string;
  className?: string;
  buttonClassName?: string;
  containerClassName?: string;
}

export default function ExpandableList<T>({
  items,
  initialCount = 5,
  renderItem,
  children,
  showMoreLabel = "Show More",
  showLessLabel = "Show Less",
  className = "",
  buttonClassName = "",
  containerClassName = "",
}: ExpandableListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const hasMore = items.length > initialCount;
  const visibleItems = isExpanded ? items : items.slice(0, initialCount);

  return (
    <div className={`space-y-4 ${containerClassName}`}>
      {children ? (
        children(visibleItems, isExpanded)
      ) : renderItem ? (
        <div className={`transition-all duration-300 ${className}`}>
          {visibleItems.map((item, index) => renderItem(item, index))}
        </div>
      ) : null}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted active:scale-95 ${buttonClassName}`}
          >
            <span>
              {isExpanded
                ? showLessLabel
                : `${showMoreLabel} (${items.length - initialCount} more)`}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
