import { FootStats } from '../types';

// Adjusted pressure levels for smoother transitions
const PRESSURE_LEVELS = [
  { threshold: 0.65, color: [255, 0, 0] },     // Highest pressure - Red
  { threshold: 0.45, color: [255, 140, 0] },   // High pressure - Orange
  { threshold: 0.35, color: [255, 255, 0] },   // Medium pressure - Yellow
  { threshold: 0.20, color: [0, 255, 0] },     // Low pressure - Green
  { threshold: 0.0, color: [255, 255, 255] }   // Lowest pressure - White
];

// Grid detection parameters
const GRID_SIZE = 8;
const GRID_THRESHOLD = 15;
const MIN_GRID_LINES = 2;
const EDGE_THRESHOLD = 30;
const GRID_SEARCH_RADIUS = 3;
const SMOOTHING_RADIUS = 4;  // Increased for better color blending
const CLUSTER_RADIUS = 16;   // Radius for color clustering

function detectEdges(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const edges = new Float32Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      const current = data[idx] * 0.3 + data[idx + 1] * 0.59 + data[idx + 2] * 0.11;
      const left = data[idx - 4] * 0.3 + data[idx - 3] * 0.59 + data[idx - 2] * 0.11;
      const right = data[idx + 4] * 0.3 + data[idx + 5] * 0.59 + data[idx + 6] * 0.11;
      const top = data[(y - 1) * width * 4 + x * 4] * 0.3 + 
                  data[(y - 1) * width * 4 + x * 4 + 1] * 0.59 + 
                  data[(y - 1) * width * 4 + x * 4 + 2] * 0.11;
      const bottom = data[(y + 1) * width * 4 + x * 4] * 0.3 + 
                    data[(y + 1) * width * 4 + x * 4 + 1] * 0.59 + 
                    data[(y + 1) * width * 4 + x * 4 + 2] * 0.11;
      
      const dx = Math.abs(right - left);
      const dy = Math.abs(bottom - top);
      const gradient = Math.sqrt(dx * dx + dy * dy);
      
      edges[y * width + x] = gradient > EDGE_THRESHOLD ? 1.0 : 0.0;
    }
  }
  
  return edges;
}

function detectGridPattern(data: Uint8ClampedArray, width: number, height: number): Float32Array {
  const gridConfidence = new Float32Array(width * height);
  const edges = detectEdges(data, width, height);
  
  for (let y = GRID_SEARCH_RADIUS; y < height - GRID_SEARCH_RADIUS; y++) {
    for (let x = GRID_SEARCH_RADIUS; x < width - GRID_SEARCH_RADIUS; x++) {
      let gridLines = 0;
      
      for (let angle = 0; angle < Math.PI; angle += Math.PI / 8) {
        let lineFound = false;
        
        for (let r = 1; r <= GRID_SEARCH_RADIUS; r++) {
          const nx = Math.round(x + r * Math.cos(angle));
          const ny = Math.round(y + r * Math.sin(angle));
          
          if (edges[ny * width + nx] > 0) {
            lineFound = true;
            break;
          }
        }
        
        if (lineFound) gridLines++;
      }
      
      const edgeStrength = edges[y * width + x];
      gridConfidence[y * width + x] = gridLines >= MIN_GRID_LINES ? 
        Math.min(1.0, (gridLines / 8) * (1 + edgeStrength)) : 0.0;
    }
  }
  
  return gridConfidence;
}

function interpolateColor(color1: number[], color2: number[], factor: number): number[] {
  return color1.map((c, i) => Math.round(c + (color2[i] - c) * factor));
}

function getColorForPressure(normalizedPressure: number): [number, number, number] {
  for (let i = 0; i < PRESSURE_LEVELS.length - 1; i++) {
    if (normalizedPressure >= PRESSURE_LEVELS[i].threshold) {
      const currentLevel = PRESSURE_LEVELS[i];
      const nextLevel = PRESSURE_LEVELS[i + 1];
      const range = currentLevel.threshold - nextLevel.threshold;
      const factor = range === 0 ? 0 : (currentLevel.threshold - normalizedPressure) / range;
      return interpolateColor(currentLevel.color, nextLevel.color, factor) as [number, number, number];
    }
  }
  return PRESSURE_LEVELS[PRESSURE_LEVELS.length - 1].color as [number, number, number];
}

const getPercentileValue = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * (sorted.length - 1));
  return sorted[index];
};

const findFootBoundingBox = (pressureMap: Float32Array, width: number, height: number) => {
  let left = width;
  let right = 0;
  let top = height;
  let bottom = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pressure = pressureMap[y * width + x];
      if (pressure > 0) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }

  // Add padding but ensure we don't go out of bounds
  const padding = Math.max(30, GRID_SIZE * 2);
  return {
    left: Math.max(0, left - padding),
    right: Math.min(width - 1, right + padding),
    top: Math.max(0, top - padding),
    bottom: Math.min(height - 1, bottom + padding)
  };
};

const smoothPressureMap = (pressureMap: Float32Array, width: number, height: number) => {
  const smoothed = new Float32Array(pressureMap.length);
  const radius = SMOOTHING_RADIUS;
  const sigma = radius / 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const value = pressureMap[ny * width + nx];
            if (value > 0) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
              sum += value * weight;
              weightSum += weight;
            }
          }
        }
      }
      
      smoothed[y * width + x] = weightSum > 0 ? sum / weightSum : 0;
    }
  }
  
  return smoothed;
};

const clusterColors = (
  pressureMap: Float32Array,
  width: number,
  height: number,
  bbox: ReturnType<typeof findFootBoundingBox>
) => {
  const clustered = new Float32Array(pressureMap.length);
  
  // First, copy the original values
  clustered.set(pressureMap);
  
  // Then apply clustering only within the bounding box
  for (let y = bbox.top; y <= bbox.bottom; y++) {
    for (let x = bbox.left; x <= bbox.right; x++) {
      if (pressureMap[y * width + x] === 0) continue;
      
      let sum = 0;
      let count = 0;
      
      for (let dy = -CLUSTER_RADIUS; dy <= CLUSTER_RADIUS; dy++) {
        const ny = y + dy;
        if (ny < bbox.top || ny > bbox.bottom) continue;
        
        for (let dx = -CLUSTER_RADIUS; dx <= CLUSTER_RADIUS; dx++) {
          const nx = x + dx;
          if (nx < bbox.left || nx > bbox.right) continue;
          
          const value = pressureMap[ny * width + nx];
          if (value > 0) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= CLUSTER_RADIUS) {
              const weight = 1 - (distance / CLUSTER_RADIUS);
              sum += value * weight;
              count += weight;
            }
          }
        }
      }
      
      if (count > 0) {
        clustered[y * width + x] = sum / count;
      }
    }
  }
  
  return clustered;
};

const drawPressurePoint = (
  outputData: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number],
  alpha: number
) => {
  const radius = Math.floor(GRID_SIZE / 2);
  
  for (let dy = -radius; dy <= radius; dy++) {
    const ny = y + dy;
    if (ny < 0 || ny >= height) continue;
    
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      if (nx < 0 || nx >= width) continue;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        const i = (ny * width + nx) * 4;
        const fade = Math.max(0, Math.min(1, 1 - (distance / radius)));
        const finalAlpha = alpha * fade;
        
        outputData[i] = Math.round(color[0] * finalAlpha + outputData[i] * (1 - finalAlpha));
        outputData[i + 1] = Math.round(color[1] * finalAlpha + outputData[i + 1] * (1 - finalAlpha));
        outputData[i + 2] = Math.round(color[2] * finalAlpha + outputData[i + 2] * (1 - finalAlpha));
        outputData[i + 3] = 255;
      }
    }
  }
};

export const processFootImage = async (
  imageFile: File
): Promise<{ heatmapUrl: string; stats: FootStats }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const gridConfidence = detectGridPattern(data, canvas.width, canvas.height);
      
      const pressureValues: number[] = [];
      const pressureMap = new Float32Array(canvas.width * canvas.height);
      
      for (let i = 0; i < data.length; i += 4) {
        const idx = i / 4;
        const intensity = 255 - (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
        const confidence = gridConfidence[idx];
        
        const pressure = intensity * confidence;
        pressureMap[idx] = pressure;
        if (pressure > 0) {
          pressureValues.push(pressure);
        }
      }
      
      const minPressure = getPercentileValue(pressureValues, 2);
      const maxPressure = getPercentileValue(pressureValues, 98);
      const pressureRange = maxPressure - minPressure;
      
      const bbox = findFootBoundingBox(pressureMap, canvas.width, canvas.height);
      const smoothedPressureMap = smoothPressureMap(pressureMap, canvas.width, canvas.height);
      const clusteredPressureMap = clusterColors(smoothedPressureMap, canvas.width, canvas.height, bbox);
      
      const outputData = new Uint8ClampedArray(data.length);
      let totalPressure = 0;
      let pixelCount = 0;
      let highestPressure = 0;
      
      // Initialize output to white
      for (let i = 0; i < outputData.length; i += 4) {
        outputData[i] = 255;
        outputData[i + 1] = 255;
        outputData[i + 2] = 255;
        outputData[i + 3] = 255;
      }
      
      const stepSize = Math.max(1, Math.floor(GRID_SIZE / 2));
      for (let y = bbox.top; y <= bbox.bottom; y += stepSize) {
        for (let x = bbox.left; x <= bbox.right; x += stepSize) {
          const idx = y * canvas.width + x;
          const pressure = clusteredPressureMap[idx];
          
          if (pressure > 0) {
            const normalizedPressure = pressureRange > 0 
              ? Math.max(0, Math.min(1, (pressure - minPressure) / pressureRange))
              : 0;
            
            const color = getColorForPressure(normalizedPressure);
            drawPressurePoint(
              outputData,
              x,
              y,
              canvas.width,
              canvas.height,
              color,
              normalizedPressure
            );
            
            pixelCount++;
            totalPressure += pressure;
            highestPressure = Math.max(highestPressure, pressure);
          }
        }
      }
      
      const outputImageData = new ImageData(outputData, canvas.width, canvas.height);
      ctx.putImageData(outputImageData, 0, 0);
      
      const stats: FootStats = {
        averagePressure: pixelCount > 0 ? totalPressure / pixelCount : 0,
        maxPressure: highestPressure,
        totalArea: pixelCount,
      };
      
      resolve({
        heatmapUrl: canvas.toDataURL('image/png'),
        stats,
      });
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
};