import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface TickerData {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  volume: number
  high: number
  low: number
  timestamp: number
}

interface PriceTickerState {
  tickers: Record<string, TickerData>
  loading: boolean
  error: string | null
  lastUpdate: Record<string, number>
  isUsingCachedData: boolean
}

const initialState: PriceTickerState = {
  tickers: {},
  loading: false,
  error: null,
  lastUpdate: {},
  isUsingCachedData: false,
}

const CRYPTO_BASE_DATA: Record<string, { price: number; volume: number }> = {
  BTCUSDT: { price: 43250, volume: 28500000000 },
  ETHUSDT: { price: 2380, volume: 15200000000 },
  ADAUSDT: { price: 0.52, volume: 850000000 },
  SOLUSDT: { price: 98.5, volume: 2100000000 },
  DOTUSDT: { price: 7.2, volume: 420000000 },
}

const generateTickerData = (symbol: string, previousData?: TickerData): TickerData => {
  const baseData = CRYPTO_BASE_DATA[symbol] || CRYPTO_BASE_DATA.BTCUSDT

  let currentPrice = baseData.price
  let priceChange = 0

  if (previousData) {
    const volatilityFactor = symbol === "BTCUSDT" ? 0.015 : symbol === "ETHUSDT" ? 0.02 : 0.03
    const randomChange = (Math.random() - 0.5) * volatilityFactor
    const momentum = previousData.priceChangePercent > 0 ? 0.3 : -0.3
    const finalChange = randomChange + momentum * 0.1 * (Math.random() - 0.5)

    currentPrice = previousData.price * (1 + finalChange)
    priceChange = currentPrice - previousData.price
  } else {
    const initialVariation = (Math.random() - 0.5) * 0.05
    currentPrice = baseData.price * (1 + initialVariation)
    priceChange = baseData.price * initialVariation
  }

  const priceChangePercent = (priceChange / (currentPrice - priceChange)) * 100
  const volatility = Math.abs(priceChangePercent) * 0.5 + 1
  const high = currentPrice * (1 + volatility / 100)
  const low = currentPrice * (1 - volatility / 100)
  const volumeVariation = 0.7 + Math.random() * 0.6
  const volume = baseData.volume * volumeVariation

  return {
    symbol,
    price: currentPrice,
    priceChange,
    priceChangePercent,
    volume,
    high,
    low,
    timestamp: Date.now(),
  }
}

export const fetchTickerData = createAsyncThunk(
  "priceTicker/fetchTickerData",
  async ({ symbol }: { symbol: string }, { getState }) => {
    try {
      // Simulate API call with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 800))

      // Simulate API success/failure (60% success rate)
      const shouldSimulateAPISuccess = Math.random() > 0.4

      if (!shouldSimulateAPISuccess) {
        throw new Error("Ticker API temporarily unavailable")
      }

      const state = getState() as { priceTicker: PriceTickerState }
      const previousData = state.priceTicker.tickers[symbol]
      const tickerData = generateTickerData(symbol, previousData)

      return {
        tickerData,
        isFromAPI: true,
      }
    } catch (error) {
      // API failed, use cached data or generate fallback
      const state = getState() as { priceTicker: PriceTickerState }
      const cachedData = state.priceTicker.tickers[symbol]

      if (cachedData) {
        // Update cached data with small variation
        const updatedData = generateTickerData(symbol, cachedData)
        return {
          tickerData: updatedData,
          isFromAPI: false,
          error: "Using cached data - API unavailable",
        }
      } else {
        // Generate new fallback data
        const fallbackData = generateTickerData(symbol)
        return {
          tickerData: fallbackData,
          isFromAPI: false,
          error: "Using demo data - API unavailable",
        }
      }
    }
  },
)

export const updateTickerRealTime = createAsyncThunk(
  "priceTicker/updateTickerRealTime",
  async ({ symbol }: { symbol: string }, { getState }) => {
    const state = getState() as { priceTicker: PriceTickerState }
    const currentTicker = state.priceTicker.tickers[symbol]

    if (!currentTicker) return null

    const updatedTicker = generateTickerData(symbol, currentTicker)
    return updatedTicker
  },
)

const priceTickerSlice = createSlice({
  name: "priceTicker",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    hydrateFromStorage: (state, action: PayloadAction<Partial<PriceTickerState>>) => {
      return { ...state, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickerData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTickerData.fulfilled, (state, action) => {
        state.loading = false
        state.tickers[action.payload.tickerData.symbol] = action.payload.tickerData
        state.lastUpdate[action.payload.tickerData.symbol] = action.payload.tickerData.timestamp
        state.isUsingCachedData = !action.payload.isFromAPI
        if (action.payload.error) {
          state.error = action.payload.error
        }
      })
      .addCase(fetchTickerData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch ticker data"
      })
      .addCase(updateTickerRealTime.fulfilled, (state, action) => {
        if (action.payload) {
          state.tickers[action.payload.symbol] = action.payload
          state.lastUpdate[action.payload.symbol] = action.payload.timestamp
        }
      })
  },
})

export const { clearError, hydrateFromStorage } = priceTickerSlice.actions
export default priceTickerSlice.reducer
