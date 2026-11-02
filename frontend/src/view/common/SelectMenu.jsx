import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SelectMenu({ value, options, onChange, label, direction = 'down' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const closeOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className={`select-menu${open ? ' is-open' : ''}${direction === 'up' ? ' is-dropup' : ''}`} ref={rootRef}>
      <button type="button" className="select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen(state => !state)}>
        <span>{value}</span><ChevronDown size={14} />
      </button>
      {open && <div className="select-options" role="listbox" aria-label={label}>
        {options.map(option => <button type="button" role="option" aria-selected={value === option} className={value === option ? 'active' : ''} key={option} onClick={() => { onChange(option); setOpen(false); }}>{option}</button>)}
      </div>}
    </div>
  );
}
