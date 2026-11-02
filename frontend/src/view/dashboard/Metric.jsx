import React from 'react';

export default function Metric({ Icon, title, value, color }) {
  return <div className="metric"><Icon size={18} /><div><span className={color}>{title}</span><strong className={color}>{value}</strong></div></div>;
}
