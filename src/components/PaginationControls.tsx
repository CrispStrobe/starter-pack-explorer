// src/components/PaginationControls.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

// with named export
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationControlsProps) {
  // Calculate the range of items being displayed
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        pageNumbers.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Middle - show current page and neighbors
        pageNumbers.push(
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6 mb-8">
      <div className="text-sm text-gray-600">
        Showing {startItem.toLocaleString()} - {endItem.toLocaleString()} of{' '}
        {totalItems.toLocaleString()} results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 
                   disabled:hover:bg-white transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={`page-${page}`}
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ) : (
              <span
                key={`ellipsis-${index}`}
                className="w-10 h-10 flex items-center justify-center text-gray-400"
              >
                {page}
              </span>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 
                   disabled:hover:bg-white transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}