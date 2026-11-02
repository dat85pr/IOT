import React from 'react';

export default function LedSwitch({ index, active, pending, onToggle }) {
  return (
    <div className="led">
      <span className={active ? 'dot active' : 'dot'} />
      <b>LED {index + 1}</b>
      <button
        aria-label={`Toggle LED ${index + 1}`}
        aria-pressed={active}
        aria-busy={pending}
        className={active ? 'on' : ''}
        disabled={pending}
        title={pending ? 'Updating LED...' : `Toggle LED ${index + 1}`}
        onClick={onToggle}
      >
        {pending ? <span className="led-loading" aria-label="Loading" /> : <i />}
      </button>
    </div>
  );
}
