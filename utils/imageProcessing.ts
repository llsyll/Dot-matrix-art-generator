
import { DitherMethod, AppSettings, DotShape } from '../types';

// Bayer Matrix for Ordered Dithering
const bayerMatrix4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const bayerMatrix8x8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
];

export const processImage = (
  sourceCanvas: HTMLCanvasElement,
  destCanvas: HTMLCanvasElement,
  settings: AppSettings
) => {
  const ctx = destCanvas.getContext('2d');
  if (!ctx) return;

  // 1. Resize & Crop Step: Create an intermediate low-res buffer
  const processWidth = Math.max(1, Math.floor(settings.outputWidth / settings.pixelSize));
  const processHeight = Math.max(1, Math.floor(settings.outputHeight / settings.pixelSize));

  const bufferCanvas = document.createElement('canvas');
  bufferCanvas.width = processWidth;
  bufferCanvas.height = processHeight;
  const bufferCtx = bufferCanvas.getContext('2d');
  if (!bufferCtx) return;

  // Fill buffer with white first
  bufferCtx.fillStyle = '#FFFFFF';
  bufferCtx.fillRect(0, 0, processWidth, processHeight);

  // Calculate "Cover" (Crop) Fit
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const dstW = processWidth;
  const dstH = processHeight;
  
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;

  let drawW, drawH, offX, offY;

  if (srcAspect > dstAspect) {
    drawH = dstH;
    drawW = srcW * (dstH / srcH);
    offY = 0;
    offX = (dstW - drawW) / 2;
  } else {
    drawW = dstW;
    drawH = srcH * (dstW / srcW);
    offX = 0;
    offY = (dstH - drawH) / 2;
  }

  bufferCtx.imageSmoothingEnabled = true;
  bufferCtx.imageSmoothingQuality = 'high';
  bufferCtx.drawImage(sourceCanvas, offX, offY, drawW, drawH);

  // 2. Text Overlay (Before Dithering)
  if (settings.showText && settings.text) {
    const scaleRatio = 1 / settings.pixelSize;
    const fontSize = Math.max(1, Math.round(settings.textSize * scaleRatio));
    const textX = settings.textX * scaleRatio;
    const textY = settings.textY * scaleRatio;
    
    const fontName = settings.fontFamily.includes(' ') ? `"${settings.fontFamily}"` : settings.fontFamily;
    bufferCtx.font = `bold ${fontSize}px ${fontName}, sans-serif`;
    
    bufferCtx.fillStyle = settings.textDark ? '#000000' : '#FFFFFF';
    bufferCtx.textBaseline = 'top';
    
    const lines = settings.text.split('\n');
    const lineHeight = fontSize * 1.2;
    
    lines.forEach((line, index) => {
      bufferCtx.fillText(line, textX, textY + (index * lineHeight));
    });
  }

  // Get raw pixel data
  const imageData = bufferCtx.getImageData(0, 0, processWidth, processHeight);
  const data = imageData.data;
  const len = data.length;

  // 3. Grayscale & Contrast/Brightness
  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    gray += settings.brightness * 255;
    gray = ((gray - 128) * settings.contrast) + 128;
    gray = Math.max(0, Math.min(255, gray));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  // 4. Dithering
  const pixelValues = new Uint8Array(processWidth * processHeight);

  if (settings.ditherMethod === DitherMethod.HALFTONE) {
      for (let i = 0; i < len; i += 4) {
        const idx = i / 4;
        pixelValues[idx] = Math.max(0, 255 - data[i]); 
      }
  } else {
      if (settings.ditherMethod === DitherMethod.THRESHOLD) {
        for (let i = 0; i < len; i += 4) pixelValues[i / 4] = data[i] < 128 ? 1 : 0;
      } else if (settings.ditherMethod === DitherMethod.RANDOM) {
        for (let i = 0; i < len; i += 4) pixelValues[i / 4] = data[i] < (Math.random() * 255) ? 1 : 0;
      } else if (settings.ditherMethod === DitherMethod.BAYER_4x4) {
        for (let y = 0; y < processHeight; y++) {
          for (let x = 0; x < processWidth; x++) {
            const i = (y * processWidth + x) * 4;
            const threshold = (bayerMatrix4x4[y % 4][x % 4] / 16) * 255;
            pixelValues[y * processWidth + x] = data[i] < threshold ? 1 : 0;
          }
        }
      } else if (settings.ditherMethod === DitherMethod.BAYER_8x8) {
          for (let y = 0; y < processHeight; y++) {
            for (let x = 0; x < processWidth; x++) {
              const i = (y * processWidth + x) * 4;
              const threshold = (bayerMatrix8x8[y % 8][x % 8] / 64) * 255;
              pixelValues[y * processWidth + x] = data[i] < threshold ? 1 : 0;
            }
          }
      } else {
        // Error Diffusion
        for (let y = 0; y < processHeight; y++) {
          for (let x = 0; x < processWidth; x++) {
            const i = (y * processWidth + x) * 4;
            const oldPixel = data[i];
            const newPixel = oldPixel < 128 ? 0 : 255; 
            
            pixelValues[y * processWidth + x] = newPixel === 0 ? 1 : 0;

            const quantError = oldPixel - newPixel;
            if (settings.ditherMethod === DitherMethod.FLOYD_STEINBERG) {
               distributeError(data, x + 1, y, quantError * (7 / 16), processWidth, processHeight);
               distributeError(data, x - 1, y + 1, quantError * (3 / 16), processWidth, processHeight);
               distributeError(data, x, y + 1, quantError * (5 / 16), processWidth, processHeight);
               distributeError(data, x + 1, y + 1, quantError * (1 / 16), processWidth, processHeight);
            } else if (settings.ditherMethod === DitherMethod.ATKINSON) {
               distributeError(data, x + 1, y, quantError * (1 / 8), processWidth, processHeight);
               distributeError(data, x + 2, y, quantError * (1 / 8), processWidth, processHeight);
               distributeError(data, x - 1, y + 1, quantError * (1 / 8), processWidth, processHeight);
               distributeError(data, x, y + 1, quantError * (1 / 8), processWidth, processHeight);
               distributeError(data, x + 1, y + 1, quantError * (1 / 8), processWidth, processHeight);
               distributeError(data, x, y + 2, quantError * (1 / 8), processWidth, processHeight);
            } else if (settings.ditherMethod === DitherMethod.SIERRA_LITE) {
               distributeError(data, x + 1, y, quantError * (2 / 4), processWidth, processHeight);
               distributeError(data, x - 1, y + 1, quantError * (1 / 4), processWidth, processHeight);
               distributeError(data, x, y + 1, quantError * (1 / 4), processWidth, processHeight);
            } else if (settings.ditherMethod === DitherMethod.STUCKI) {
                const d = 42;
                distributeError(data, x+1, y, quantError * (8/d), processWidth, processHeight);
                distributeError(data, x+2, y, quantError * (4/d), processWidth, processHeight);
                distributeError(data, x-2, y+1, quantError * (2/d), processWidth, processHeight);
                distributeError(data, x-1, y+1, quantError * (4/d), processWidth, processHeight);
                distributeError(data, x,   y+1, quantError * (8/d), processWidth, processHeight);
                distributeError(data, x+1, y+1, quantError * (4/d), processWidth, processHeight);
                distributeError(data, x+2, y+1, quantError * (2/d), processWidth, processHeight);
                distributeError(data, x-2, y+2, quantError * (1/d), processWidth, processHeight);
                distributeError(data, x-1, y+2, quantError * (2/d), processWidth, processHeight);
                distributeError(data, x,   y+2, quantError * (4/d), processWidth, processHeight);
                distributeError(data, x+1, y+2, quantError * (2/d), processWidth, processHeight);
                distributeError(data, x+2, y+2, quantError * (1/d), processWidth, processHeight);
            }
          }
        }
      }
  }

  // 5. Drawing Step (Render to offscreen canvas first to handle Ink Bleed)
  const shapeCanvas = document.createElement('canvas');
  shapeCanvas.width = settings.outputWidth;
  shapeCanvas.height = settings.outputHeight;
  const shapeCtx = shapeCanvas.getContext('2d');
  if (!shapeCtx) return;

  // Use black for shapes initially, we will composite color later
  shapeCtx.fillStyle = '#000000';
  shapeCtx.strokeStyle = '#000000';

  const maxDotSize = settings.pixelSize - settings.gap;
  const isHalftone = settings.ditherMethod === DitherMethod.HALFTONE;

  for (let y = 0; y < processHeight; y++) {
    for (let x = 0; x < processWidth; x++) {
      const idx = y * processWidth + x;
      const val = pixelValues[idx];

      if (val === 0) continue; 

      const drawX = x * settings.pixelSize;
      const drawY = y * settings.pixelSize;
      const centerX = drawX + settings.pixelSize / 2;
      const centerY = drawY + settings.pixelSize / 2;

      let drawSize = maxDotSize;
      
      if (isHalftone) {
          if (val < 10) continue;
          drawSize = (val / 255) * maxDotSize;
      }
      
      if (drawSize < 0.5) continue;

      drawShape(shapeCtx, settings.dotShape, centerX, centerY, drawSize, val);
    }
  }

  // 6. Apply Ink Bleed (Blur + Soft Threshold) OR Enforce Hard Edges for standard rendering
  if (settings.inkBleed > 0) {
      const blurCanvas = document.createElement('canvas');
      blurCanvas.width = settings.outputWidth;
      blurCanvas.height = settings.outputHeight;
      const blurCtx = blurCanvas.getContext('2d');
      if (blurCtx) {
          blurCtx.imageSmoothingEnabled = true;
          blurCtx.imageSmoothingQuality = 'high';
          
          // Apply blur
          blurCtx.filter = `blur(${settings.inkBleed}px)`;
          blurCtx.drawImage(shapeCanvas, 0, 0);
          blurCtx.filter = 'none';

          // Apply Soft Threshold (Anti-aliased Cutoff)
          const imageData = blurCtx.getImageData(0, 0, settings.outputWidth, settings.outputHeight);
          const px = imageData.data;
          
          const thresholdCenter = 160;
          const feather = 10; 
          const lowerBound = thresholdCenter - feather;
          const upperBound = thresholdCenter + feather;
          const range = upperBound - lowerBound;

          for(let i=0; i<px.length; i+=4) {
              const alpha = px[i+3];
              
              if (alpha <= lowerBound) {
                  px[i+3] = 0; // Fully transparent
              } else if (alpha >= upperBound) {
                  px[i+3] = 255; // Fully opaque
                  px[i] = 0; px[i+1] = 0; px[i+2] = 0;
              } else {
                  // Anti-aliased edge
                  const newAlpha = ((alpha - lowerBound) / range) * 255;
                  px[i+3] = newAlpha;
                  px[i] = 0; px[i+1] = 0; px[i+2] = 0;
              }
          }
          blurCtx.putImageData(imageData, 0, 0);
          
          // Overwrite shapeCanvas with the bled version
          shapeCtx.clearRect(0,0, settings.outputWidth, settings.outputHeight);
          shapeCtx.drawImage(blurCanvas, 0, 0);
      }
  } else {
      // ENFORCE HARD EDGES (Hard Thresholding)
      // When Ink Bleed is OFF, we want crisp 1-bit edges for thermal printing.
      // This removes the gray anti-aliased halo around dots.
      const imageData = shapeCtx.getImageData(0, 0, settings.outputWidth, settings.outputHeight);
      const px = imageData.data;
      for (let i = 0; i < px.length; i += 4) {
          // If a pixel is more than 50% opaque, make it 100% opaque. Otherwise 0%.
          if (px[i+3] < 128) {
              px[i+3] = 0;
          } else {
              px[i+3] = 255;
              // Force black color
              px[i] = 0; px[i+1] = 0; px[i+2] = 0;
          }
      }
      shapeCtx.putImageData(imageData, 0, 0);
  }

  // 7. Final Composite to Destination Canvas
  destCanvas.width = settings.outputWidth;
  destCanvas.height = settings.outputHeight;

  // Background
  if (settings.transparentBackground) {
      ctx.clearRect(0, 0, destCanvas.width, destCanvas.height);
  } else {
      ctx.fillStyle = settings.inverted ? settings.foregroundColor : settings.backgroundColor;
      ctx.fillRect(0, 0, destCanvas.width, destCanvas.height);
  }

  // Foreground (Colorizing the black shapeCanvas)
  const fgColor = settings.inverted ? settings.backgroundColor : settings.foregroundColor;
  
  // Draw the shapes
  ctx.save();
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = settings.outputWidth;
  colorCanvas.height = settings.outputHeight;
  const colorCtx = colorCanvas.getContext('2d');
  if(colorCtx) {
      // Draw the shapes
      colorCtx.drawImage(shapeCanvas, 0, 0);
      // Change composite mode
      colorCtx.globalCompositeOperation = 'source-in';
      // Fill with desired color
      colorCtx.fillStyle = fgColor;
      colorCtx.fillRect(0, 0, settings.outputWidth, settings.outputHeight);
  }

  // Draw final colored shapes to destination
  // If we want hard edges, disabling smoothing here helps retain the pixel grid
  // However, since we already thresholded shapeCanvas, smoothing shouldn't introduce new grays
  // unless we are scaling (which we aren't, it's 1:1 here). 
  // We'll leave it enabled for Ink Bleed cases, but the thresholding above handles the standard case.
  ctx.imageSmoothingEnabled = settings.inkBleed > 0;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(colorCanvas, 0, 0);
  ctx.restore();
};

function drawShape(ctx: CanvasRenderingContext2D, shape: DotShape, cx: number, cy: number, size: number, val: number) {
    switch(shape) {
        case DotShape.SQUARE:
            ctx.fillRect(cx - size/2, cy - size/2, size, size);
            break;
        case DotShape.CIRCLE:
            ctx.beginPath();
            ctx.arc(cx, cy, size/2, 0, Math.PI * 2);
            ctx.fill();
            break;
        case DotShape.DIAMOND:
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-size/2, -size/2, size, size);
            ctx.restore();
            break;
        case DotShape.TRIANGLE:
            ctx.beginPath();
            const h = size * (Math.sqrt(3)/2);
            ctx.moveTo(cx, cy - h/2);
            ctx.lineTo(cx - size/2, cy + h/2);
            ctx.lineTo(cx + size/2, cy + h/2);
            ctx.closePath();
            ctx.fill();
            break;
        case DotShape.CROSS:
             ctx.save();
             ctx.translate(cx, cy);
             ctx.rotate(Math.PI / 4);
             const w = size;
             const t = size / 3;
             ctx.fillRect(-w/2, -t/2, w, t);
             ctx.fillRect(-t/2, -w/2, t, w);
             ctx.restore();
             break;
        case DotShape.PLUS:
             const plusT = size / 3;
             ctx.fillRect(cx - size/2, cy - plusT/2, size, plusT);
             ctx.fillRect(cx - plusT/2, cy - size/2, plusT, size);
             break;
        case DotShape.HEART:
             const topCurveHeight = size * 0.3;
             ctx.save();
             ctx.translate(cx, cy - size * 0.1);
             ctx.beginPath();
             ctx.moveTo(0, topCurveHeight);
             ctx.bezierCurveTo(0, 0, -size/2, 0, -size/2, topCurveHeight);
             ctx.bezierCurveTo(-size/2, (size + topCurveHeight)/2, 0, (size + topCurveHeight)/2 + size/3, 0, size);
             ctx.bezierCurveTo(0, (size + topCurveHeight)/2 + size/3, size/2, (size + topCurveHeight)/2, size/2, topCurveHeight);
             ctx.bezierCurveTo(size/2, 0, 0, 0, 0, topCurveHeight);
             ctx.fill();
             ctx.restore();
             break;
        case DotShape.STAR:
             drawStar(ctx, cx, cy, 5, size/2, size/4);
             break;
        case DotShape.ASCII:
             ctx.font = `${Math.floor(size)}px monospace`;
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             ctx.fillText(getAsciiChar(val), cx, cy);
             break;
    }
}

function distributeError(data: Uint8ClampedArray, x: number, y: number, err: number, w: number, h: number) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const i = (y * w + x) * 4;
  data[i] += err;
  data[i + 1] += err;
  data[i + 2] += err;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function getAsciiChar(val: number): string {
    if (val < 50) return '.';
    if (val < 100) return ':';
    if (val < 150) return '+';
    if (val < 200) return '#';
    return '@';
}
