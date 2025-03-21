export interface FootStats {
  averagePressure: number;
  maxPressure: number;
  totalArea: number;
}

export interface FootAnalysis {
  originalImage: string;
  heatmapImage: string;
  stats: FootStats;
}