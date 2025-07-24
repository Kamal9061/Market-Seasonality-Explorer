import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

export interface OrderbookEntry {
  price: number
  quantity: number
  total: number
}

export interface OrderbookData {
  bids: OrderbookEntry[]
  asks: OrderbookEntry[]
  lastUpdateId: number
  timestamp: number
  symbol: string
}

interface OrderbookState {
  orderbooks: Record<string, OrderbookData>
  loading: boolean
  error: string | null
  lastUpdate: Record<string, number>
  isUsingCachedData: boolean
}

const initialState: OrderbookState = {
  orderbooks: {},
  loading: false,
  error: null,
  lastUpdate: {},
  isUsingCachedData: false,
}

const generateOrderbook = (symbol: string, currentPrice: number, limit = 20): OrderbookData => {
  const spread = currentPrice * 0.001
  const bids: OrderbookEntry[] = []
  const asks: OrderbookEntry[] = []

  let bidTotal = 0
  let askTotal = 0

  for (let i = 0; i < limit; i++) {
    const priceStep = spread * (0.1 + i * 0.05)
    const bidPrice = currentPrice - spread / 2 - priceStep
    const askPrice = currentPrice + spread / 2 + priceStep

    const baseQuantity = 5 + Math.random() * 10
    const distanceFactor = 1 + i * 0.2
    const quantity = baseQuantity * distanceFactor

    bidTotal += quantity
    bids.push({
      price: Math.max(bidPrice, 0.01),
      quantity,
      total: bidTotal,
    })

    askTotal += quantity
    asks.push({
      price: askPrice,
      quantity,
      total: askTotal,
    })
  }

  return {
    bids,
    asks,
    lastUpdateId: Date.now(),
    timestamp: Date.now(),
    symbol,
  }
}

export const fetchOrderbook = createAsyncThunk(
  "orderbook/fetchOrderbook",
  async ({ symbol, currentPrice }: { symbol: string; currentPrice?: number }, { getState }) => {
    try {
      // Simulate API call with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600))

      // Simulate API success/failure (50% success rate)
      const shouldSimulateAPISuccess = Math.random() > 0.5

      if (!shouldSimulateAPISuccess) {
        throw new Error("Orderbook API temporarily unavailable")
      }

      const fallbackPrices: Record<string, number> = {
        BTCUSDT: 43250,
        ETHUSDT: 2380,
        ADAUSDT: 0.52,
        SOLUSDT: 98.5,
        DOTUSDT: 7.2,
      }

      const price = currentPrice || fallbackPrices[symbol] || 1.0
      const orderbookData = generateOrderbook(symbol, price)

      return {
        orderbookData,
        isFromAPI: true,
      }
    } catch (error) {
      // API failed, use cached data or generate fallback
      const state = getState() as { orderbook: OrderbookState }
      const cachedData = state.orderbook.orderbooks[symbol]

      const fallbackPrices: Record<string, number> = {
        BTCUSDT: 43250,
        ETHUSDT: 2380,
        ADAUSDT: 0.52,
        SOLUSDT: 98.5,
        DOTUSDT: 7.2,
      }

      const price = currentPrice || fallbackPrices[symbol] || 1.0

      if (cachedData) {
        // Update cached orderbook with new price
        const updatedOrderbook = generateOrderbook(symbol, price)
        return {
          orderbookData: updatedOrderbook,
          isFromAPI: false,
          error: "Using cached data - API unavailable",
        }
      } else {
        // Generate new fallback data
        const fallbackData = generateOrderbook(symbol, price)
        return {
          orderbookData: fallbackData,
          isFromAPI: false,
          error: "Using demo data - API unavailable",
        }
      }
    }
  },
)

export const updateOrderbookRealTime = createAsyncThunk(
  "orderbook/updateOrderbookRealTime",
  async ({ symbol, currentPrice }: { symbol: string; currentPrice: number }, { getState }) => {
    const state = getState() as { orderbook: OrderbookState }
    const currentOrderbook = state.orderbook.orderbooks[symbol]

    if (!currentOrderbook) return null

    // Update orderbook with small variations
    const spread = currentPrice * 0.001
    const updatedBids = currentOrderbook.bids.map((bid) => {
      const priceVariation = (Math.random() - 0.5) * spread * 0.1
      const quantityVariation = (Math.random() - 0.5) * 0.2

      return {
        ...bid,
        price: Math.max(bid.price + priceVariation, 0.01),
        quantity: Math.max(bid.quantity * (1 + quantityVariation), 0.1),
      }
    })

    const updatedAsks = currentOrderbook.asks.map((ask) => {
      const priceVariation = (Math.random() - 0.5) * spread * 0.1
      const quantityVariation = (Math.random() - 0.5) * 0.2

      return {
        ...ask,
        price: ask.price + priceVariation,
        quantity: Math.max(ask.quantity * (1 + quantityVariation), 0.1),
      }
    })

    // Recalculate totals
    let bidTotal = 0
    const finalBids = updatedBids.map((bid) => {
      bidTotal += bid.quantity
      return { ...bid, total: bidTotal }
    })

    let askTotal = 0
    const finalAsks = updatedAsks.map((ask) => {
      askTotal += ask.quantity
      return { ...ask, total: askTotal }
    })

    return {
      bids: finalBids,
      asks: finalAsks,
      lastUpdateId: Date.now(),
      timestamp: Date.now(),
      symbol,
    }
  },
)

const orderbookSlice = createSlice({
  name: "orderbook",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    hydrateFromStorage: (state, action: PayloadAction<Partial<OrderbookState>>) => {
      return { ...state, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderbook.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrderbook.fulfilled, (state, action) => {
        state.loading = false
        state.orderbooks[action.payload.orderbookData.symbol] = action.payload.orderbookData
        state.lastUpdate[action.payload.orderbookData.symbol] = action.payload.orderbookData.timestamp
        state.isUsingCachedData = !action.payload.isFromAPI
        if (action.payload.error) {
          state.error = action.payload.error
        }
      })
      .addCase(fetchOrderbook.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to fetch orderbook data"
      })
      .addCase(updateOrderbookRealTime.fulfilled, (state, action) => {
        if (action.payload) {
          state.orderbooks[action.payload.symbol] = action.payload
          state.lastUpdate[action.payload.symbol] = action.payload.timestamp
        }
      })
  },
})

export const { clearError, hydrateFromStorage } = orderbookSlice.actions
export default orderbookSlice.reducer
