import React, { useEffect, useState } from 'react';
import { Check, Clipboard, X } from 'lucide-react';

export default function CopyableTime({ value }) {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (status === 'idle') return undefined;
    const timeout = window.setTimeout(() => setStatus('idle'), 1800);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const copyTime = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API is unavailable');
      }
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch (error) {
      console.error('Unable to copy time value:', error);
      setStatus('error');
    }
  };

  const label = status === 'copied'
    ? 'Time copied'
    : status === 'error'
      ? 'Unable to copy time'
      : 'Copy time';
  const Icon = status === 'copied' ? Check : status === 'error' ? X : Clipboard;

  return (
    <span className="copyable-time">
      <span>{value}</span>
      <button type="button" className={`copy-time-btn ${status}`} onClick={copyTime} aria-label={label} title={label}>
        <Icon size={13} />
      </button>
    </span>
  );
}
