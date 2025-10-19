"use client";

import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ...props
}: PaginationProps) => {
  const pages = [];
  const maxPagesToShow = 5;

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show first page, last page, and pages around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) pages.push(1);
    if (startPage > 2) pages.push(-1); // Ellipsis

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) pages.push(-1); // Ellipsis
    if (endPage < totalPages) pages.push(totalPages);
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      {...props}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      {pages.map((page, idx) =>
        page === -1 ? (
          <span key={`ellipsis-${idx}`} className="px-2">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "primary" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export { Pagination };
