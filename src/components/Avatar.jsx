import React, { useState } from 'react';

const COLORS = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', 
  '#319795', '#3182ce', '#805ad5', '#d63384',
  '#6c5ce7', '#00cec9', '#ff4757', '#e84393'
];

export function formatAuthorName(name) {
  if (!name || name === 'undefined' || name.trim() === '') {
    return 'Deleted User';
  }
  return name;
}

export function getInitials(name) {
  const safeName = formatAuthorName(name);
  const words = safeName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  // Word 1 + Word 2 initials (Ignores Word 3+)
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

function getAvatarColor(name) {
  const safeName = formatAuthorName(name);
  if (safeName === 'Deleted User') return '#4a5568';
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export const Avatar = ({ src, name, size = 56, style = {}, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const displayName = formatAuthorName(name);

  if (src && !imgError) {
    return (
      <img
        className="avatar"
        src={src}
        alt={displayName}
        onError={() => setImgError(true)}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          cursor: onClick ? 'pointer' : 'default',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  const initials = getInitials(displayName);
  const backgroundColor = getAvatarColor(displayName);

  return (
    <div
      className="avatar initial-avatar"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: Math.max(12, Math.floor(size * 0.4)),
        userSelect: 'none',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
