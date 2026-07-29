import React, { useRef, useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

export const AvatarCanvas = ({ onClose }) => {
  const { checkAuth } = useAuth();
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rawImage, setRawImage] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setRawImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!rawImage) return;

    const w = rawImage.width * zoom * (canvas.width / rawImage.width);
    const h = rawImage.height * zoom * (canvas.height / rawImage.height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(rawImage, (canvas.width - w) / 2 + offset.x, (canvas.height - h) / 2 + offset.y, w, h);
    ctx.restore();
  };

  useEffect(() => {
    draw();
  }, [rawImage, zoom, offset]);

  const handleMouseDown = (e) => {
    if (!rawImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleUpload = async () => {
    if (!rawImage) return alert('Please select an image first.');

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 700;
    exportCanvas.height = 700;
    const ctx = exportCanvas.getContext('2d');

    const scaleFactor = 700 / 200;
    const w = rawImage.width * zoom * (200 / rawImage.width) * scaleFactor;
    const h = rawImage.height * zoom * (200 / rawImage.height) * scaleFactor;

    ctx.save();
    ctx.beginPath();
    ctx.arc(350, 350, 350, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(rawImage, (700 - w) / 2 + (offset.x * scaleFactor), (700 - h) / 2 + (offset.y * scaleFactor), w, h);
    ctx.restore();

    exportCanvas.toBlob(async (blob) => {
      if (!blob) return alert('Failed to generate WebP blob.');

      const formData = new FormData();
      formData.append('avatar', blob, 'avatar.webp');

      try {
        await apiFetch('/api/user/avatar', { method: 'POST', body: formData });
        alert('Avatar updated successfully!');
        await checkAuth();
        if (onClose) onClose();
      } catch (err) {
        alert('Avatar upload error: ' + err.message);
      }
    }, 'image/webp', 0.9);
  };

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Select an image, adjust crop/scale using the canvas, and save. Exported as WebP (max 700x700).
      </p>
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="canvas-container">
        <canvas
          id="avatarCanvas"
          ref={canvasRef}
          width="200"
          height="200"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="canvas-controls">
          <label style={{ fontSize: '0.8rem' }}>Zoom:</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleUpload}>
        <i className="fa-solid fa-upload"></i> Upload Canvas Avatar
      </button>
    </div>
  );
};
