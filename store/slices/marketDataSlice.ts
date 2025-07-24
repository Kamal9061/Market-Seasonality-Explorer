import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import type { MarketData } from "@/types/market"

interface MarketDataState {
  data: Record<string, MarketData[]> // Keyed by symbol
  loading: boolean
  error: string | null
  lastUpdate: Record<string, number> // Timestamp of last update per symbol
  connectionStatus: "connected" | "disconnected" | "connecting" | "error" | "polling"
  isUsingCachedData: boolean
}

const initialState: MarketDataState = {
  data: {},
  loading: false,
  error: null,
  lastUpdate: {},
  connectionStatus: "disconnected",
  isUsingCachedData: false,
}

// Generate realistic market data
const generateRealisticMarketData = (symbol: string, month: Date): MarketData[] => {
  const CRYPTO_BASE_DATA: Record<string, { price: number; volume: number }> = {
    BTCUSDT: { price: 43250, volume: 28500000000 },
    ETHUSDT: { price: 2380, volume: 15200000000 },
    ADAUSDT: { price: 0.52, volume: 850000000 },
    SOLUSDT: { price: 98.5, volume: 2100000000 },
    DOTUSDT: { price: 7.2, volume: 420000000 },
  }

  const data: MarketData[] = []
  const baseData = CRYPTO_BASE_DATA[symbol] || CRYPTO_BASE_DATA.BTCUSDT

  const startDate = new Date(month.getFullYear(), month.getMonth(), 1)
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  let currentPrice = baseData.price
  let trend = (Math.random() - 0.5) * 0.02

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const volatilityFactor = symbol === "BTCUSDT" ? 0.03 : symbol === "ETHUSDT" ? 0.04 : 0.06
    const dailyChange = (Math.random() - 0.5) * volatilityFactor + trend * 0.1

    const newPrice = currentPrice * (1 + dailyChange)
    const dayVolatility = Math.abs(dailyChange) + Math.random() * 0.02

    const open = currentPrice
    const close = newPrice
    const high = Math.max(open, close) * (1 + Math.random() * dayVolatility)
    const low = Math.min(open, close) * (1 - Math.random() * dayVolatility)

    const dayOfWeek = d.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0
    const volumeVariation = (0.5 + Math.random()) * weekendFactor
    const volume = baseData.volume * volumeVariation

    data.push({
      date: new Date(d),
      price: close,
      open: open,
      high: high,
      low: low,
      volume: volume,
      priceChange: dailyChange,
      volatility: dayVolatility,
    })

    currentPrice = newPrice
    trend += (Math.random() - 0.5) * 0.005
    trend = Math.max(-0.05, Math.min(0.05, trend))
  }

  return data
}

// Async thunk for fetching market data with fallback
export const fetchMarketData = createAsyncThunk(
  "marketData/fetchMarketData",
  async ({ symbol, month }: { symbol: string; month: Date }, { getState, rejectWithValue }) => {
    try {
      // Simulate API call with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200))

      // Simulate API success/failure (70% success rate)
      const shouldSimulateAPISuccess = Math.random() > 0.3

      if (!shouldSimulateAPISuccess) {
        throw new Error("API temporarily unavailable")
      }

      const data = generateRealisticMarketData(symbol, month)

      return {
        symbol,
        data,
        isFromAPI: true,
        timestamp: Date.now(),
      }
    } catch (error) {
      // API failed, check if we have cached data
      const state = getState() as { marketData: MarketDataState }
      const cachedData = state.marketData.data[symbol]

      if (cachedData && cachedData.length > 0) {
        // Use cached data but update timestamp
        return {
          symbol,
          data: cachedData,
          isFromAPI: false,
          timestamp: Date.now(),
          error: "Using cached data - API unavailable",
        }
      } else {
        // No cached data, generate fallback data
        const fallbackData = generateRealisticMarketData(symbol, month)
        return {
          symbol,
          data: fallbackData,
          isFromAPI: false,
          timestamp: Date.now(),
          error: "Using demo data - API unavailable",
        }
      }
    }
  },
)

// Async thunk for real-time updates
export const updateRealTimeData = createAsyncThunk(
  "marketData/updateRealTimeData",
  async ({ symbol }: { symbol: string }, { getState }) => {
    const state = getState() as { marketData: MarketDataState }
    const currentData = state.marketData.data[symbol]

    if (!currentData || currentData.length === 0) return null

    const lastDataPoint = currentData[currentData.length - 1]
    const volatilityFactor = symbol === "BTCUSDT" ? 0.008 : symbol === "ETHUSDT" ? 0.012 : 0.018
    const priceChange = (Math.random() - 0.5) * volatilityFactor

    const momentum = lastDataPoint.priceChange > 0 ? 0.2 : -0.2
    const finalChange = priceChange + momentum * 0.1 * (Math.random() - 0.5)

    const newPrice = lastDataPoint.price * (1 + finalChange)
    const newHigh = Math.max(lastDataPoint.high, newPrice * (1 + Math.random() * 0.005))
    const newLow = Math.min(lastDataPoint.low, newPrice * (1 - Math.random() * 0.005))

    const updatedDataPoint: MarketData = {
      ...lastDataPoint,
      price: newPrice,
      high: newHigh,
      low: newLow,
      priceChange: finalChange,
      volatility: Math.abs(finalChange) * 2,
      volume: lastDataPoint.volume * (0.95 + Math.random() * 0.1),
    }

    return {
      symbol,
      updatedDataPoint,
      timestamp: Date.now(),
    }
  },
)

const marketDataSlice = createSlice({
  name: "marketData",
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<MarketDataState["connectionStatus"]>) => {
      state.connectionStatus = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    // Add action to handle hydration
    hydrateFromStorage: (state, action: PayloadAction<Partial<MarketDataState>>) => {
      return { ...state, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true
        state.connectionStatus = "connecting"
        state.error = null
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false
        state.data[action.payload.symbol] = action.payload.data
        state.lastUpdate[action.payload.symbol] = action.payload.timestamp
        state.connectionStatus = action.payload.isFromAPI ? "connected" : "polling"
        state.isUsingCachedData = !action.payload.isFromAPI
        if (action.payload.error) {
          state.error = action.payload.error
        }
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false
        state.connectionStatus = "error"
        state.error = action.error.message || "Failed to fetch market data"
      })
      .addCase(updateRealTimeData.fulfilled, (state, action) => {
        if (action.payload) {
          const { symbol, updatedDataPoint } = action.payload
          const currentData = state.data[symbol]
          if (currentData && currentData.length > 0) {
            const today = new Date().toDateString()
            const lastDataPoint = currentData[currentData.length - 1]

            if (lastDataPoint.date.toDateString() === today) {
              // Update today's data
              currentData[currentData.length - 1] = updatedDataPoint
            } else {
              // Add new data point for today
              updatedDataPoint.date = new Date()
              currentData.push(updatedDataPoint)
            }

            state.lastUpdate[symbol] = action.payload.timestamp
          }
        }
      })
  },
})

export const { setConnectionStatus, clearError, hydrateFromStorage } = marketDataSlice.actions
export default marketDataSlice.reducer
