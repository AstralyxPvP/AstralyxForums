import React, { useRef, useState, useEffect } from 'react';

export default function AvatarCanvas({ onUploadSuccess }) {
  const canvasRef = useRef(null);
  const [rawImage, setRawImage] = useState(null);
  const [zoom, setZoom] = useState(1);
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
        setRawImage(img);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
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
    drawCanvas();
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

  const handleUpload = () => {
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
      if (!blob) return alert('Failed to generate image blob.');
      onUploadSuccess(blob);
    }, 'image/webp', 0.9);
  };

  return (
    <div className="canvas-container">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <canvas
        ref={canvasRef}
        id="avatarCanvas"
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
      <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={handleUpload}>
        <i className="fa-solid fa-upload"></i> Upload Canvas Avatar
      </button>
    </div>
  );
}
