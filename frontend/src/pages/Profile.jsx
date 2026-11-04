import React from 'react';
import { ExternalLink } from 'lucide-react';
import avatarImg from '../assets/avatar.png';

const details = [
  ['Full name', 'Hoàng Đinh Đạt'],
  ['Student ID', 'B23DCCN129'],
  ['Email', 'dathoangdinh11@gmail.com'],
  ['Github', 'https://github.com/dat85pr/IOT'],
  ['Figma', 'https://www.figma.com/design/Yf8shgPaInXJkeam3KwsCd/Iot---UD?node-id=0-1&p=f&t=yEbXAfUbDogDtNBs-0'],
  ['Postman', 'https://sl1nk.com/dpalbp0'],
  ['Report', 'https://docs.google.com/document/d/1ytGKV_L8s05z3xLE--hKPV5NpjNWBcUy1QzoRIYBftQ/edit?tab=t.6kjxpc2bf4un#heading=h.9bit7t21aew7'],
];

export default function Profile() {
  return (
    <div className="profile-card">
      <img src={avatarImg} alt="Hoàng Đinh Đạt" className="portrait" style={{ objectFit: 'cover', display: 'block' }} />
      <div className="profile-rows">
        {details.map(([label, value], index) => {
          const isLink = Boolean(value && (value.startsWith('http://') || value.startsWith('https://')));
          return (
            <div className={index % 2 === 0 ? 'shade' : ''} key={label}>
              <b>{label}</b>
              {isLink ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-open-btn"
                  title={`Open ${label}`}
                >
                  <span>Open</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                <strong>{value || '—'}</strong>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
