import { configureStore } from "@reduxjs/toolkit"
import { combineReducers } from "@reduxjs/toolkit"
import marketDataReducer from "./slices/marketDataSlice"
import orderbookReducer from "./slices/orderbookSlice"
import priceTickerReducer from "./slices/priceTickerSlice"
import { appStorage } from "@/lib/storage"

const rootReducer = combineReducers({
  marketData: marketDataReducer,
  orderbook: orderbookReducer,
  priceTicker: priceTickerReducer,
})

// Load persisted state
const loadPersistedState = () => {
  try {
    const persistedState = appStorage.loadState()
    return persistedState || undefined
  } catch (error) {
    console.warn("Failed to load persisted state:", error)
    return undefined
  }
}

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadPersistedState(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date objects in our state
        ignoredPaths: ["marketData.data", "orderbook.orderbooks"],
        ignoredActions: ["marketData/fetchMarketData/fulfilled", "marketData/updateRealTimeData/fulfilled"],
      },
    }),
})

// Subscribe to store changes and persist state
store.subscribe(() => {
  const state = store.getState()
  appStorage.saveState(state)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
