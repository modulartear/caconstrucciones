import sharp from 'sharp';

export async function analyzeImageSimpleCanvas(imageBuffer, width, height) {
  const blockSize = 8;
  const floorStart = Math.floor(height * 0.55);
  const wallEnd = Math.floor(height * 0.75);

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const wallMask = Buffer.alloc(width * height, 0);
  const floorMask = Buffer.alloc(width * height, 0);

  let totalR = 0, totalG = 0, totalB = 0, totalPixels = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    totalPixels++;
  }

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      const bh = Math.min(blockSize, height - by);
      const bw = Math.min(blockSize, width - bx);

      let r = 0, g = 0, b = 0, count = 0;
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = (y * width + x) * info.channels;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      r /= count; g /= count; b /= count;

      let variance = 0;
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = (y * width + x) * info.channels;
          variance += Math.pow(data[idx] - r, 2) + Math.pow(data[idx + 1] - g, 2) + Math.pow(data[idx + 2] - b, 2);
        }
      }
      variance /= count;

      const brightness = (r + g + b) / 3;
      const maxCh = Math.max(r, g, b);
      const minCh = Math.min(r, g, b);
      const saturation = maxCh > 0 ? (maxCh - minCh) / maxCh : 0;

      const isUniform = variance < 800;
      const isNotTooDark = brightness > 40;
      const isNotTooSaturated = saturation < 0.6;
      
      const isFloorArea = by >= floorStart;
      const isWallArea = by <= wallEnd && !isFloorArea;

      let wallValue = 0;
      let floorValue = 0;

      if (isUniform && isNotTooDark && isNotTooSaturated) {
        if (isFloorArea) {
          floorValue = 1;
        } else if (isWallArea) {
          wallValue = 1;
        }
      }

      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          const idx = y * width + x;
          wallMask[idx] = wallValue;
          floorMask[idx] = floorValue;
        }
      }
    }
  }

  const dilate = (mask, times = 2) => {
    let result = Buffer.from(mask);
    for (let t = 0; t < times; t++) {
      const temp = Buffer.from(result);
      for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
          const idx = y * width + x;
          const neighbors = [
            result[(y - 2) * width + x],
            result[(y - 1) * width + x],
            result[(y + 1) * width + x],
            result[(y + 2) * width + x],
            result[y * width + (x - 2)],
            result[y * width + (x - 1)],
            result[y * width + (x + 1)],
            result[y * width + (x + 2)],
            result[(y - 1) * width + (x - 1)],
            result[(y - 1) * width + (x + 1)],
            result[(y + 1) * width + (x - 1)],
            result[(y + 1) * width + (x + 1)]
          ];
          if (neighbors.filter(n => n).length >= 5) temp[idx] = 1;
        }
      }
      result = temp;
    }
    return result;
  };

  const erode = (mask, times = 1) => {
    let result = Buffer.from(mask);
    for (let t = 0; t < times; t++) {
      const temp = Buffer.from(result);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const neighbors = [
            result[(y - 1) * width + x],
            result[(y + 1) * width + x],
            result[y * width + (x - 1)],
            result[y * width + (x + 1)],
            result[idx]
          ];
          if (!neighbors.every(n => n)) temp[idx] = 0;
        }
      }
      result = temp;
    }
    return result;
  };

  const fillHoles = (mask) => {
    let result = Buffer.from(mask);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (result[idx] === 0) {
          const neighbors = [
            result[(y - 1) * width + x],
            result[(y + 1) * width + x],
            result[y * width + (x - 1)],
            result[y * width + (x + 1)]
          ];
          if (neighbors.every(n => n === 1)) {
            result[idx] = 1;
          }
        }
      }
    }
    return result;
  };

  let processedWalls = dilate(wallMask, 4);
  processedWalls = erode(processedWalls, 2);
  processedWalls = fillHoles(processedWalls);
  processedWalls = dilate(processedWalls, 2);
  
  let processedFloors = dilate(floorMask, 3);
  processedFloors = erode(processedFloors, 1);
  processedFloors = fillHoles(processedFloors);
  processedFloors = dilate(processedFloors, 2);

  for (let y = floorStart; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (processedFloors[idx]) {
        processedWalls[idx] = 0;
      }
    }
  }

  const maskToBase64 = async (mask) => {
    const rgbaData = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      const val = mask[i] ? 255 : 0;
      rgbaData[idx] = val;
      rgbaData[idx + 1] = val;
      rgbaData[idx + 2] = val;
      rgbaData[idx + 3] = 255;
    }
    return await sharp(rgbaData, { raw: { width, height, channels: 4 } })
      .png()
      .toBuffer()
      .then(buf => 'data:image/png;base64,' + buf.toString('base64'));
  };

  return {
    walls: await maskToBase64(processedWalls),
    floors: await maskToBase64(processedFloors)
  };
}

export function analyzeImageSimple(imageBase64) {
  return {
    walls: '',
    floors: ''
  };
}

export async function processHFMask(data, width, height, wallLabels, floorLabels) {
  return {
    walls: '',
    floors: ''
  };
}

export async function processHFSegments(data, width, height, wallLabels, floorLabels) {
  return {
    walls: '',
    floors: ''
  };
}
