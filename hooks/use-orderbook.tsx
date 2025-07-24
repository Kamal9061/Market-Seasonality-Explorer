"use client"

import { useState, useEffect, useRef, useCallback } from "react"

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
}

interface UseOrderbookProps {
  symbol: string
  limit?: number
  currentPrice?: number
}

interface UseOrderbookReturn {
  orderbook: OrderbookData | null
  loading: boolean
  error: string | null
  isConnected: boolean
}

// Generate realistic orderbook data based on current price
const generateRealisticOrderbook = (symbol: string, currentPrice: number, limit = 20): OrderbookData => {
  const spread = currentPrice * 0.001 // 0.1% spread
  const bids: OrderbookEntry[] = []
  const asks: OrderbookEntry[] = []

  let bidTotal = 0
  let askTotal = 0

  // Generate bids (buy orders) - decreasing prices
  for (let i = 0; i < limit; i++) {
    const priceStep = spread * (0.1 + i * 0.05) // Increasing steps away from mid price
    const price = currentPrice - spread / 2 - priceStep

    // Larger quantities closer to the spread
    const baseQuantity = 5 + Math.random() * 10
    const distanceFactor = 1 + i * 0.2 // More quantity further from spread
    const quantity = baseQuantity * distanceFactor

    bidTotal += quantity
    bids.push({
      price: Math.max(price, 0.01), // Ensure positive price
      quantity,
      total: bidTotal,
    })
  }

  // Generate asks (sell orders) - increasing prices
  for (let i = 0; i < limit; i++) {
    const priceStep = spread * (0.1 + i * 0.05)
    const price = currentPrice + spread / 2 + priceStep

    const baseQuantity = 5 + Math.random() * 10
    const distanceFactor = 1 + i * 0.2
    const quantity = baseQuantity * distanceFactor

    askTotal += quantity
    asks.push({
      price,
      quantity,
      total: askTotal,
    })
  }

  return {
    bids,
    asks,
    lastUpdateId: Date.now(),
    timestamp: Date.now(),
  }
}

// Simulate orderbook updates with realistic market behavior
const updateOrderbook = (prevOrderbook: OrderbookData, currentPrice: number): OrderbookData => {
  const spread = currentPrice * 0.001

  // Update existing orders with small variations
  const updatedBids = prevOrderbook.bids.map((bid, index) => {
    const priceVariation = (Math.random() - 0.5) * spread * 0.1
    const quantityVariation = (Math.random() - 0.5) * 0.2

    return {
      ...bid,
      price: Math.max(bid.price + priceVariation, 0.01),
      quantity: Math.max(bid.quantity * (1 + quantityVariation), 0.1),
    }
  })

  const updatedAsks = prevOrderbook.asks.map((ask, index) => {
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
  }
}

export function useOrderbook({ symbol, limit = 20, currentPrice }: UseOrderbookProps): UseOrderbookReturn {
  const [orderbook, setOrderbook] = useState<OrderbookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const generateOrderbook = useCallback(() => {
    try {
      console.log(`Generating realistic orderbook for ${symbol}`)

      if (currentPrice && currentPrice > 0) {
        const orderbookData = generateRealisticOrderbook(symbol, currentPrice, limit)
        setOrderbook(orderbookData)
        setError(null)
        setIsConnected(true)
        setLoading(false)
        console.log(`Successfully generated orderbook for ${symbol} at $${currentPrice}`)
      } else {
        // Use fallback price if current price not available
        const fallbackPrices: Record<string, number> = {
          BTCUSDT: 43250,
          ETHUSDT: 2380,
          ADAUSDT: 0.52,
          SOLUSDT: 98.5,
          DOTUSDT: 7.2,
        }

        const fallbackPrice = fallbackPrices[symbol] || 1.0
        const orderbookData = generateRealisticOrderbook(symbol, fallbackPrice, limit)
        setOrderbook(orderbookData)
        setError("Using demo data - price feed unavailable")
        setIsConnected(false)
        setLoading(false)
        console.log(`Using fallback orderbook for ${symbol}`)
      }
    } catch (err) {
      console.error("Error generating orderbook:", err)
      setError("Failed to generate orderbook")
      setIsConnected(false)
      setLoading(false)
    }
  }, [symbol, limit, currentPrice])

  const startRealTimeUpdates = useCallback(() => {
    // Clear any existing updates
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    console.log("Starting real-time orderbook updates...")

    // Update orderbook every 2-5 seconds for realistic market feel
    const updateInterval = 2000 + Math.random() * 3000
    updateIntervalRef.current = setInterval(() => {
      if (orderbook && currentPrice) {
        const updatedOrderbook = updateOrderbook(orderbook, currentPrice)
        setOrderbook(updatedOrderbook)
      }

      // Vary the next update interval
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        const nextInterval = 2000 + Math.random() * 3000
        updateIntervalRef.current = setInterval(() => {
          if (orderbook && currentPrice) {
            const updatedOrderbook = updateOrderbook(orderbook, currentPrice)
            setOrderbook(updatedOrderbook)
          }
        }, nextInterval)
      }
    }, updateInterval)
  }, [orderbook, currentPrice])

  const stopUpdates = useCallback(() => {
    console.log("Stopping orderbook updates...")

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }

    setIsConnected(false)
  }, [])

  useEffect(() => {
    setLoading(true)

    // Simulate loading time
    setTimeout(
      () => {
        generateOrderbook()
        startRealTimeUpdates()
      },
      300 + Math.random() * 700,
    )

    return () => {
      stopUpdates()
    }
  }, [generateOrderbook, startRealTimeUpdates, stopUpdates])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUpdates()
    }
  }, [stopUpdates])

  return {
    orderbook,
    loading,
    error,
    isConnected: currentPrice ? true : false,
  }
}
