import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pager({ page, setPage, max }) {
  const pages = [];
  const total = Math.max(1, max);
  if (total <= 4) {
    for (let index = 1; index <= total; index += 1) pages.push(index);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let index = Math.max(2, page - 1); index <= Math.min(total - 1, page + 1); index += 1) {
      if (!pages.includes(index)) pages.push(index);
    }
    if (page < total - 2) pages.push('…');
    if (!pages.includes(total)) pages.push(total);
  }

  return (
    <div className="pager">
      <button type="button" disabled={page <= 1} onClick={() => setPage(1)}>First</button>
      <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>
        <ChevronLeft size={15} />
      </button>
      {pages.map((item, index) => item === '…'
        ? <button type="button" key={`ellipsis-${index}`} disabled aria-label="More pages">…</button>
        : <button type="button" key={item} className={page === item ? 'chosen' : ''} onClick={() => setPage(item)}>{item}</button>)}
      <button type="button" aria-label="Next page" disabled={page >= total} onClick={() => setPage(page + 1)}>
        <ChevronRight size={15} />
      </button>
      <button type="button" disabled={page >= total} onClick={() => setPage(total)}>Last</button>
    </div>
  );
}
