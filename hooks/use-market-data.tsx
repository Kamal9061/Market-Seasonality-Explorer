"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { ViewMode, MarketData } from "@/types/market"

interface UseMarketDataProps {
  symbol: string
  viewMode: ViewMode
  month: Date
}

interface UseMarketDataReturn {
  data: MarketData[]
  loading: boolean
  error: string | null
  refetch: () => void
  connectionStatus: "connected" | "disconnected" | "connecting" | "error" | "polling"
}

// Symbol mapping with realistic base data
const CRYPTO_BASE_DATA: Record<string, { price: number; volume: number }> = {
  BTCUSDT: { price: 43250, volume: 28500000000 },
  ETHUSDT: { price: 2380, volume: 15200000000 },
  ADAUSDT: { price: 0.52, volume: 850000000 },
  SOLUSDT: { price: 98.5, volume: 2100000000 },
  DOTUSDT: { price: 7.2, volume: 420000000 },
}

// Generate realistic historical market data
const generateRealisticMarketData = (symbol: string, month: Date, days = 30): MarketData[] => {
  const data: MarketData[] = []
  const baseData = CRYPTO_BASE_DATA[symbol] || CRYPTO_BASE_DATA.BTCUSDT

  const startDate = new Date(month.getFullYear(), month.getMonth(), 1)
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  let currentPrice = baseData.price
  let trend = (Math.random() - 0.5) * 0.02 // Overall monthly trend

  // Generate data for each day in the month
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Create realistic daily price movements
    const volatilityFactor = symbol === "BTCUSDT" ? 0.03 : symbol === "ETHUSDT" ? 0.04 : 0.06
    const dailyChange = (Math.random() - 0.5) * volatilityFactor + trend * 0.1

    const newPrice = currentPrice * (1 + dailyChange)
    const dayVolatility = Math.abs(dailyChange) + Math.random() * 0.02

    // Generate OHLC data
    const open = currentPrice
    const close = newPrice
    const high = Math.max(open, close) * (1 + Math.random() * dayVolatility)
    const low = Math.min(open, close) * (1 - Math.random() * dayVolatility)

    // Generate realistic volume with weekly patterns
    const dayOfWeek = d.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0 // Lower weekend volume
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

    // Gradually change trend
    trend += (Math.random() - 0.5) * 0.005
    trend = Math.max(-0.05, Math.min(0.05, trend)) // Keep trend reasonable
  }

  return data
}

// Simulate real-time price updates
const simulateRealTimeUpdate = (lastData: MarketData, symbol: string): MarketData => {
  const volatilityFactor = symbol === "BTCUSDT" ? 0.008 : symbol === "ETHUSDT" ? 0.012 : 0.018
  const priceChange = (Math.random() - 0.5) * volatilityFactor

  // Add some momentum from previous change
  const momentum = lastData.priceChange > 0 ? 0.2 : -0.2
  const finalChange = priceChange + momentum * 0.1 * (Math.random() - 0.5)

  const newPrice = lastData.price * (1 + finalChange)
  const newHigh = Math.max(lastData.high, newPrice * (1 + Math.random() * 0.005))
  const newLow = Math.min(lastData.low, newPrice * (1 - Math.random() * 0.005))

  return {
    ...lastData,
    price: newPrice,
    high: newHigh,
    low: newLow,
    priceChange: finalChange,
    volatility: Math.abs(finalChange) * 2,
    volume: lastData.volume * (0.95 + Math.random() * 0.1), // Small volume variation
  }
}

export function useMarketData({ symbol, viewMode, month }: UseMarketDataProps): UseMarketDataReturn {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting" | "error" | "polling"
  >("disconnected")

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  const generateData = useCallback(() => {
    console.log(`Generating realistic market data for ${symbol}`)

    setLoading(true)
    setConnectionStatus("connecting")

    // Simulate loading time for realism
    setTimeout(
      () => {
        try {
          const marketData = generateRealisticMarketData(symbol, month)

          setData(marketData)
          setConnectionStatus("polling")
          setError(null)
          setLoading(false)

          console.log(`Generated ${marketData.length} data points for ${symbol}`)

          // Start real-time simulation
          startRealTimeSimulation()
        } catch (err) {
          console.error("Error generating market data:", err)
          setError("Failed to generate market data")
          setConnectionStatus("error")
          setLoading(false)
        }
      },
      500 + Math.random() * 1000,
    ) // 0.5-1.5 second loading simulation
  }, [symbol, month])

  const startRealTimeSimulation = useCallback(() => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    if (isPollingRef.current) return

    isPollingRef.current = true
    console.log("Starting real-time market simulation...")

    // Update every 5-15 seconds for realistic feel
    const updateInterval = 5000 + Math.random() * 10000
    pollingIntervalRef.current = setInterval(() => {
      setData((prevData) => {
        if (prevData.length === 0) return prevData

        const updatedData = [...prevData]
        const lastIndex = updatedData.length - 1

        if (lastIndex >= 0) {
          const today = new Date()
          const lastDataPoint = updatedData[lastIndex]

          // If the last data point is from today, update it
          if (lastDataPoint.date.toDateString() === today.toDateString()) {
            updatedData[lastIndex] = simulateRealTimeUpdate(lastDataPoint, symbol)
          } else {
            // Add new data point for today if needed
            const newDataPoint = simulateRealTimeUpdate(lastDataPoint, symbol)
            newDataPoint.date = today
            updatedData.push(newDataPoint)
          }
        }

        return updatedData
      })

      // Vary the next update interval for realism
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        const nextInterval = 5000 + Math.random() * 10000
        pollingIntervalRef.current = setInterval(() => {
          // Recursive call to maintain varying intervals
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            startRealTimeSimulation()
          }
        }, nextInterval)
      }
    }, updateInterval)
  }, [symbol])

  const stopSimulation = useCallback(() => {
    console.log("Stopping real-time simulation...")

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    isPollingRef.current = false
    setConnectionStatus("disconnected")
  }, [])

  useEffect(() => {
    generateData()

    return () => {
      stopSimulation()
    }
  }, [generateData, stopSimulation])

  const refetch = useCallback(() => {
    console.log("Manual refetch requested...")
    stopSimulation()
    generateData()
  }, [generateData, stopSimulation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSimulation()
    }
  }, [stopSimulation])

  return {
    data,
    loading,
    error,
    refetch,
    connectionStatus,
  }
}
