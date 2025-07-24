"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient, wsClient, isAPIEnabled } from "@/lib/api-client"

interface TickerData {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  volume: number
  high: number
  low: number
  timestamp: number
  source: string
}

interface UseRealPriceTickerProps {
  symbol: string
}

interface UseRealPriceTickerReturn {
  ticker: TickerData | null
  loading: boolean
  error: string | null
  isConnected: boolean
  dataSource: string
  refetch: () => void
}

export function useRealPriceTicker({ symbol }: UseRealPriceTickerProps): UseRealPriceTickerReturn {
  const [ticker, setTicker] = useState<TickerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [dataSource, setDataSource] = useState<string>("none")

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wsConnectedRef = useRef(false)

  // Fetch current price from real APIs
  const fetchCurrentPrice = useCallback(async () => {
    if (!isAPIEnabled()) {
      setError("Real API is disabled. Enable in environment variables.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`🚀 Fetching real price data for ${symbol}...`)

      const priceData = await apiClient.getCurrentPrice(symbol)

      if (!priceData) {
        throw new Error("No price data received from API")
      }

      const tickerData: TickerData = {
        symbol: priceData.symbol,
        price: priceData.price,
        priceChange: priceData.priceChange,
        priceChangePercent: priceData.priceChangePercent,
        volume: priceData.volume,
        high: priceData.high || priceData.price * 1.02,
        low: priceData.low || priceData.price * 0.98,
        timestamp: priceData.lastUpdated || Date.now(),
        source: priceData.source,
      }

      setTicker(tickerData)
      setDataSource(priceData.source)
      setIsConnected(true)
      setLoading(false)

      console.log(`✅ Successfully loaded price data from ${priceData.source}:`, tickerData)

      // Start real-time updates
      startRealTimeUpdates()
    } catch (err) {
      console.error("❌ Failed to fetch price data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch price data")
      setIsConnected(false)
      setLoading(false)

      // Try fallback data
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
      console.log(`🔌 Connecting WebSocket for price ticker ${symbol}...`)

      wsClient.connect(symbol, (wsData) => {
        console.log(`📡 WebSocket price update for ${symbol}:`, wsData)

        setTicker((prevTicker) => {
          if (!prevTicker) return null

          return {
            ...prevTicker,
            price: wsData.price,
            priceChange: wsData.priceChange,
            priceChangePercent: wsData.priceChange,
            volume: wsData.volume,
            high: Math.max(prevTicker.high, wsData.high),
            low: Math.min(prevTicker.low, wsData.low),
            timestamp: wsData.timestamp,
            source: wsData.source,
          }
        })

        setDataSource(wsData.source)
        setIsConnected(true)
      })

      wsConnectedRef.current = true
    }

    // Fallback to polling if WebSocket is not available
    if (process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== "true") {
      console.log(`🔄 Starting polling for price ticker ${symbol}...`)

      const refreshInterval = Number.parseInt(process.env.NEXT_PUBLIC_DEFAULT_REFRESH_INTERVAL || "30000")

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const currentPrice = await apiClient.getCurrentPrice(symbol)
          console.log(`📊 Price polling update for ${symbol}:`, currentPrice)

          setTicker((prevTicker) => ({
            symbol: currentPrice.symbol,
            price: currentPrice.price,
            priceChange: currentPrice.priceChange,
            priceChangePercent: currentPrice.priceChangePercent,
            volume: currentPrice.volume,
            high: currentPrice.high || currentPrice.price * 1.02,
            low: currentPrice.low || currentPrice.price * 0.98,
            timestamp: currentPrice.lastUpdated || Date.now(),
            source: currentPrice.source,
          }))

          setDataSource(currentPrice.source)
          setIsConnected(true)
        } catch (error) {
          console.warn("Price polling update failed:", error)
          setIsConnected(false)
        }
      }, refreshInterval)
    }
  }, [symbol])

  // Fallback to demo data if APIs fail
  const tryFallbackData = useCallback(() => {
    console.log("🔄 Generating fallback price data...")

    const basePrice = symbol === "BTCUSDT" ? 43250 : symbol === "ETHUSDT" ? 2380 : 100
    const randomChange = (Math.random() - 0.5) * 0.05

    const fallbackTicker: TickerData = {
      symbol,
      price: basePrice * (1 + randomChange),
      priceChange: basePrice * randomChange,
      priceChangePercent: randomChange * 100,
      volume: Math.random() * 1000000000,
      high: basePrice * (1 + Math.abs(randomChange) + 0.01),
      low: basePrice * (1 - Math.abs(randomChange) - 0.01),
      timestamp: Date.now(),
      source: "fallback-demo",
    }

    setTicker(fallbackTicker)
    setDataSource("fallback-demo")
    setIsConnected(false)
    setError("Using demo data - API unavailable")

    console.log("✅ Fallback price data generated successfully")
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
    fetchCurrentPrice()
  }, [cleanup, fetchCurrentPrice])

  // Initialize data fetching
  useEffect(() => {
    fetchCurrentPrice()

    return cleanup
  }, [fetchCurrentPrice, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    ticker,
    loading,
    error,
    isConnected,
    dataSource,
    refetch,
  }
}
