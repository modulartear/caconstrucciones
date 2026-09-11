import React, { useEffect, useRef } from 'react';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getMaskValue(maskData, index, total) {
  if (!maskData || index >= maskData.length) return 1;
  const value = Number(maskData[index]);
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 1 ? value / 255 : value;
  return normalized > 0.35 ? Math.min(1, normalized) : 0;
}

export default function RoomCanvas({ bgImageSrc, materialImageSrc, maskData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!bgImageSrc || !materialImageSrc || !canvasRef.current) return undefined;

    let cancelled = false;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    const render = async () => {
      const [background, material] = await Promise.all([
        loadImage(bgImageSrc),
        loadImage(materialImageSrc),
      ]);
      if (cancelled) return;

      const maxWidth = 1100;
      const scale = Math.min(1, maxWidth / background.naturalWidth);
      const width = Math.max(1, Math.round(background.naturalWidth * scale));
      const height = Math.max(1, Math.round(background.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;

      context.clearRect(0, 0, width, height);
      context.drawImage(background, 0, 0, width, height);

      const backgroundPixels = context.getImageData(0, 0, width, height);
      const materialCanvas = document.createElement('canvas');
      materialCanvas.width = width;
      materialCanvas.height = height;
      const materialContext = materialCanvas.getContext('2d');

      // Repite la textura de forma proporcional: evita estirarla y conserva vetas/paneles.
      const tileWidth = Math.max(80, Math.round(width * 0.22));
      const tileHeight = Math.max(80, Math.round(tileWidth * (material.naturalHeight / material.naturalWidth)));
      const pattern = materialContext.createPattern(material, 'repeat');
      pattern.setTransform(new DOMMatrix().scale(tileWidth / material.naturalWidth, tileHeight / material.naturalHeight));
      materialContext.fillStyle = pattern;
      materialContext.fillRect(0, 0, width, height);

      const materialPixels = materialContext.getImageData(0, 0, width, height);
      const output = context.createImageData(width, height);
      const totalPixels = width * height;
      const maskScale = maskData?.length ? Math.sqrt(maskData.length / totalPixels) : 1;

      for (let index = 0; index < totalPixels; index += 1) {
        const pixel = index * 4;
        const x = index % width;
        const y = Math.floor(index / width);
        const maskX = Math.min(width - 1, Math.floor(x * maskScale));
        const maskY = Math.min(height - 1, Math.floor(y * maskScale));
        const maskIndex = maskY * width + maskX;
        const coverage = getMaskValue(maskData, maskIndex, totalPixels);

        const originalR = backgroundPixels.data[pixel];
        const originalG = backgroundPixels.data[pixel + 1];
        const originalB = backgroundPixels.data[pixel + 2];
        const luminance = (originalR * 0.2126 + originalG * 0.7152 + originalB * 0.0722) / 255;
        const light = 0.62 + luminance * 0.68;
        const materialR = Math.min(255, materialPixels.data[pixel] * light);
        const materialG = Math.min(255, materialPixels.data[pixel + 1] * light);
        const materialB = Math.min(255, materialPixels.data[pixel + 2] * light);

        output.data[pixel] = originalR * (1 - coverage) + materialR * coverage;
        output.data[pixel + 1] = originalG * (1 - coverage) + materialG * coverage;
        output.data[pixel + 2] = originalB * (1 - coverage) + materialB * coverage;
        output.data[pixel + 3] = 255;
      }

      context.putImageData(output, 0, 0);
    };

    render().catch((error) => console.error('[v0] Error al renderizar material:', error));
    return () => {
      cancelled = true;
    };
  }, [bgImageSrc, materialImageSrc, maskData]);

  return (
    <div style={{ width: '100%', maxWidth: 1100, borderRadius: 8, overflow: 'hidden', lineHeight: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} aria-label="Vista previa del material aplicado" />
    </div>
  );
}
