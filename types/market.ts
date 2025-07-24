export type ViewMode = "daily" | "weekly" | "monthly"

export interface MarketData {
  date: Date
  price: number
  open: number
  high: number
  low: number
  volume: number
  priceChange: number
  volatility: number
}

export interface TimeRange {
  start: Date
  end: Date
}

export interface MarketMetrics {
  volatility: number
  liquidity: number
  performance: number
  volume: number
}
