"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient, isAPIEnabled } from "@/lib/api-client"

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
  source: string
}

interface UseRealOrderbookProps {
  symbol: string
  limit?: number
}

interface UseRealOrderbookReturn {
  orderbook: OrderbookData | null
  loading: boolean
  error: string | null
  isConnected: boolean
  dataSource: string
  refetch: () => void
}

export function useRealOrderbook({ symbol, limit = 20 }: UseRealOrderbookProps): UseRealOrderbookReturn {
  const [orderbook, setOrderbook] = useState<OrderbookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [dataSource, setDataSource] = useState<string>("none")

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch orderbook from real APIs
  const fetchOrderbook = useCallback(async () => {
    if (!isAPIEnabled()) {
      setError("Real API is disabled. Enable in environment variables.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(`🚀 Fetching real orderbook data for ${symbol}...`)

      const orderbookData = await apiClient.getOrderBook(symbol)

      if (!orderbookData) {
        throw new Error("No orderbook data received from API")
      }

      const processedOrderbook: OrderbookData = {
        bids: orderbookData.bids,
        asks: orderbookData.asks,
        lastUpdateId: orderbookData.lastUpdateId,
        timestamp: orderbookData.timestamp,
        symbol: orderbookData.symbol,
        source: orderbookData.source,
      }

      setOrderbook(processedOrderbook)
      setDataSource(orderbookData.source)
      setIsConnected(true)
      setLoading(false)

      console.log(`✅ Successfully loaded orderbook from ${orderbookData.source}`)

      // Start real-time updates
      startRealTimeUpdates()
    } catch (err) {
      console.error("❌ Failed to fetch orderbook:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orderbook")
      setIsConnected(false)
      setLoading(false)

      // Try fallback data
      tryFallbackData()
    }
  }, [symbol, limit])

  // Start real-time orderbook updates
  const startRealTimeUpdates = useCallback(() => {
    if (!isAPIEnabled()) return

    // Clear existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    console.log(`🔄 Starting orderbook polling for ${symbol}...`)

    // Orderbook updates every 5-10 seconds
    const refreshInterval = 5000 + Math.random() * 5000

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const orderbookData = await apiClient.getOrderBook(symbol)
        console.log(`📊 Orderbook update for ${symbol}`)

        setOrderbook((prevOrderbook) => ({
          bids: orderbookData.bids,
          asks: orderbookData.asks,
          lastUpdateId: orderbookData.lastUpdateId,
          timestamp: orderbookData.timestamp,
          symbol: orderbookData.symbol,
          source: orderbookData.source,
        }))

        setDataSource(orderbookData.source)
        setIsConnected(true)
      } catch (error) {
        console.warn("Orderbook polling update failed:", error)
        setIsConnected(false)
      }
    }, refreshInterval)
  }, [symbol])

  // Fallback to demo data if APIs fail
  const tryFallbackData = useCallback(() => {
    console.log("🔄 Generating fallback orderbook data...")

    const basePrice = symbol === "BTCUSDT" ? 43250 : symbol === "ETHUSDT" ? 2380 : 100
    const spread = basePrice * 0.001

    const bids: OrderbookEntry[] = []
    const asks: OrderbookEntry[] = []

    let bidTotal = 0
    let askTotal = 0

    // Generate bids (buy orders)
    for (let i = 0; i < limit; i++) {
      const price = basePrice - spread / 2 - spread * i * 0.1
      const quantity = 5 + Math.random() * 10
      bidTotal += quantity

      bids.push({
        price: Math.max(price, 0.01),
        quantity,
        total: bidTotal,
      })
    }

    // Generate asks (sell orders)
    for (let i = 0; i < limit; i++) {
      const price = basePrice + spread / 2 + spread * i * 0.1
      const quantity = 5 + Math.random() * 10
      askTotal += quantity

      asks.push({
        price,
        quantity,
        total: askTotal,
      })
    }

    const fallbackOrderbook: OrderbookData = {
      bids,
      asks,
      lastUpdateId: Date.now(),
      timestamp: Date.now(),
      symbol,
      source: "fallback-demo",
    }

    setOrderbook(fallbackOrderbook)
    setDataSource("fallback-demo")
    setIsConnected(false)
    setError("Using demo data - API unavailable")

    console.log("✅ Fallback orderbook data generated successfully")
  }, [symbol, limit])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Refetch function
  const refetch = useCallback(() => {
    cleanup()
    fetchOrderbook()
  }, [cleanup, fetchOrderbook])

  // Initialize data fetching
  useEffect(() => {
    fetchOrderbook()

    return cleanup
  }, [fetchOrderbook, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    orderbook,
    loading,
    error,
    isConnected,
    dataSource,
    refetch,
  }
}
