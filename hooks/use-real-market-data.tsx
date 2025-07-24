"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient, wsClient, isAPIEnabled } from "@/lib/api-client"
import type { ViewMode, MarketData } from "@/types/market"

interface UseRealMarketDataProps {
  symbol: string
  viewMode: ViewMode
  month: Date
}

interface UseRealMarketDataReturn {
  data: MarketData[]
  loading: boolean
  error: string | null
  refetch: () => void
  connectionStatus: "connected" | "disconnected" | "connecting" | "error" | "polling"
  dataSource: string
}

export function useRealMarketData({ symbol, viewMode, month }: UseRealMarketDataProps): UseRealMarketDataReturn {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting" | "error" | "polling"
  >("disconnected")
  const [dataSource, setDataSource] = useState<string>("none")

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsConnectedRef = useRef(false)

  // Fetch historical data from real APIs
  const fetchHistoricalData = useCallback(async () => {
    if (!isAPIEnabled()) {
      setError("Real API is disabled. Enable in environment variables.")
      setLoading(false)
      return
    }

    setLoading(true)
    setConnectionStatus("connecting")
    setError(null)

    try {
      console.log(`🚀 Fetching real historical data for ${symbol}...`)

      const historicalData = await apiClient.getHistoricalData(symbol)

      if (!historicalData || historicalData.length === 0) {
        throw new Error("No historical data received from API")
      }

      // Process and format the data
      const processedData: MarketData[] = historicalData.map((item, index) => {
        const prevItem = index > 0 ? historicalData[index - 1] : item
        const priceChange = (item.price - prevItem.price) / prevItem.price

        return {
          date: new Date(item.date),
          price: item.price,
          open: item.open || item.price,
          high: item.high || item.price * 1.02,
          low: item.low || item.price * 0.98,
          volume: item.volume || 0,
          priceChange: priceChange,
          volatility: Math.abs(priceChange),
        }
      })

      setData(processedData)
      setDataSource(historicalData[0]?.source || "unknown")
      setConnectionStatus("connected")
      setLoading(false)

      console.log(
        `✅ Successfully loaded ${processedData.length} historical data points from ${historicalData[0]?.source}`,
      )

      // Start real-time updates
      startRealTimeUpdates()
    } catch (err) {
      console.error("❌ Failed to fetch historical data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch historical data")
      setConnectionStatus("error")
      setLoading(false)

      // Try to use cached data or fallback
      tryFallbackData()
    }
  }, [symbol])

  // Start real-time price updates
  const startRealTimeUpdates = useCallback(() => {
    if (!isAPIEnabled()) return

    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Try WebSocket first
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === "true" && !wsConnectedRef.current) {
      console.log(`🔌 Connecting WebSocket for ${symbol}...`)

      wsClient.connect(symbol, (wsData) => {
        console.log(`📡 WebSocket data received for ${symbol}:`, wsData)

        setData((prevData) => {
          if (prevData.length === 0) return prevData

          const updatedData = [...prevData]
          const lastIndex = updatedData.length - 1

          // Update the latest data point with WebSocket data
          if (lastIndex >= 0) {
            updatedData[lastIndex] = {
              ...updatedData[lastIndex],
              price: wsData.price,
              high: Math.max(updatedData[lastIndex].high, wsData.high),
              low: Math.min(updatedData[lastIndex].low, wsData.low),
              volume: wsData.volume,
              priceChange: wsData.priceChange / 100, // Convert percentage to decimal
              volatility: Math.abs(wsData.priceChange / 100),
            }
          }

          return updatedData
        })

        setConnectionStatus("connected")
        setDataSource(wsData.source)
      })

      wsConnectedRef.current = true
    }

    // Fallback to polling if WebSocket is not available
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== "true") {
      console.log(`🔄 Starting polling updates for ${symbol}...`)
      setConnectionStatus("polling")

      const refreshInterval = Number.parseInt(process.env.NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL || "30000")

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const currentPrice = await apiClient.getCurrentPrice(symbol)
          console.log(`📊 Polling update for ${symbol}:`, currentPrice)

          setData((prevData) => {
            if (prevData.length === 0) return prevData

            const updatedData = [...prevData]
            const lastIndex = updatedData.length - 1

            if (lastIndex >= 0) {
              const prevPrice = updatedData[lastIndex].price
              const priceChange = (currentPrice.price - prevPrice) / prevPrice

              updatedData[lastIndex] = {
                ...updatedData[lastIndex],
                price: currentPrice.price,
                high: Math.max(updatedData[lastIndex].high, currentPrice.high || currentPrice.price),
                low: Math.min(updatedData[lastIndex].low, currentPrice.low || currentPrice.price),
                volume: currentPrice.volume || updatedData[lastIndex].volume,
                priceChange: priceChange,
                volatility: Math.abs(priceChange),
              }
            }

            return updatedData
          })

          setDataSource(currentPrice.source)
          setConnectionStatus("polling")
        } catch (error) {
          console.warn("Polling update failed:", error)
          setConnectionStatus("error")
        }
      }, refreshInterval)
    }
  }, [symbol])

  // Fallback to demo data if APIs fail
  const tryFallbackData = useCallback(() => {
    console.log("🔄 Trying fallback data generation...")

    // Generate realistic demo data as fallback
    const generateFallbackData = (): MarketData[] => {
      const basePrice = symbol === "BTCUSDT" ? 43250 : symbol === "ETHUSDT" ? 2380 : 100
      const data: MarketData[] = []
      let currentPrice = basePrice

      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))

        const dailyChange = (Math.random() - 0.5) * 0.05
        const newPrice = currentPrice * (1 + dailyChange)

        data.push({
          date,
          price: newPrice,
          open: currentPrice,
          high: newPrice * (1 + Math.random() * 0.02),
          low: newPrice * (1 - Math.random() * 0.02),
          volume: Math.random() * 1000000000,
          priceChange: dailyChange,
          volatility: Math.abs(dailyChange),
        })

        currentPrice = newPrice
      }

      return data
    }

    const fallbackData = generateFallbackData()
    setData(fallbackData)
    setDataSource("fallback-demo")
    setConnectionStatus("disconnected")
    setError("Using demo data - API unavailable")

    console.log("✅ Fallback data generated successfully")
  }, [symbol])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    if (wsConnectedRef.current) {
      wsClient.disconnect()
      wsConnectedRef.current = false
    }
  }, [])

  // Refetch function
  const refetch = useCallback(() => {
    cleanup()
    fetchHistoricalData()
  }, [cleanup, fetchHistoricalData])

  // Initialize data fetching
  useEffect(() => {
    fetchHistoricalData()

    return cleanup
  }, [fetchHistoricalData, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    data,
    loading,
    error,
    refetch,
    connectionStatus,
    dataSource,
  }
}
