"use client"

import { cn } from "@/lib/utils"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Wifi, Loader2, AlertCircle, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/hooks/use-app-selector"
import { useAppDispatch } from "@/hooks/use-app-dispatch"
import { fetchOrderbook, updateOrderbookRealTime } from "@/store/slices/orderbookSlice"

interface OrderbookPanelProps {
  symbol: string
  currentPrice?: number
}

export function OrderbookPanel({ symbol, currentPrice }: OrderbookPanelProps) {
  const dispatch = useAppDispatch()
  const { orderbooks, loading, error, isUsingCachedData, lastUpdate } = useAppSelector((state) => state.orderbook)

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const orderbook = orderbooks[symbol]
  const lastUpdateTime = lastUpdate[symbol]

  // Initial fetch
  useEffect(() => {
    dispatch(fetchOrderbook({ symbol, currentPrice }))
  }, [dispatch, symbol, currentPrice])

  // Real-time updates
  useEffect(() => {
    if (!orderbook || !currentPrice) return

    const startRealTimeUpdates = () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }

      const updateInterval = 2000 + Math.random() * 3000 // 2-5 seconds
      updateIntervalRef.current = setInterval(() => {
        dispatch(updateOrderbookRealTime({ symbol, currentPrice }))
      }, updateInterval)
    }

    startRealTimeUpdates()

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [dispatch, symbol, currentPrice, orderbook])

  const handleManualRefresh = () => {
    dispatch(fetchOrderbook({ symbol, currentPrice }))
  }

  if (loading && !orderbook) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Order Book</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 sm:py-8">
            <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin mr-2" />
            <span className="text-sm">Loading orderbook...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!orderbook) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Order Book</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 sm:py-8 space-y-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Unable to load order book data</p>
            <Button size="sm" variant="outline" onClick={handleManualRefresh}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const spread = orderbook.asks[0]?.price - orderbook.bids[0]?.price
  const spreadPercentage = spread ? (spread / orderbook.asks[0]?.price) * 100 : 0
  const maxTotal = Math.max(orderbook.bids[0]?.total || 0, orderbook.asks[0]?.total || 0)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Order Book</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isUsingCachedData ? "secondary" : "default"} className="text-xs">
              {isUsingCachedData ? (
                <>
                  <Database className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  Cached
                </>
              ) : (
                <>
                  <Wifi className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  Live
                </>
              )}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {symbol}
            </Badge>
            <Button size="sm" variant="ghost" onClick={handleManualRefresh} disabled={loading} className="h-6 w-6 p-0">
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        {/* Spread Information */}
        <div className="text-center p-2 bg-muted/50 rounded-lg">
          <div className="text-xs sm:text-sm text-muted-foreground">Spread</div>
          <div className="font-medium text-sm sm:text-base">
            ${spread?.toFixed(2)} ({spreadPercentage.toFixed(3)}%)
          </div>
        </div>

        {/* Asks (Sell Orders) */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            <span className="text-xs sm:text-sm font-medium text-red-500">Asks (Sell)</span>
          </div>
          <div className="space-y-1">
            {orderbook.asks
              .slice()
              .reverse()
              .slice(0, 8)
              .map((ask, index) => (
                <div
                  key={`ask-${ask.price}-${index}`}
                  className="relative flex justify-between items-center text-xs p-1 rounded"
                >
                  <div
                    className="absolute inset-0 bg-red-500/10 rounded"
                    style={{
                      width: `${(ask.total / maxTotal) * 100}%`,
                    }}
                  />
                  <span className="relative z-10 font-mono text-red-600 text-xs">${ask.price.toFixed(2)}</span>
                  <span className="relative z-10 font-mono text-xs">{ask.quantity.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>

        <Separator />

        {/* Bids (Buy Orders) */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            <span className="text-xs sm:text-sm font-medium text-green-500">Bids (Buy)</span>
          </div>
          <div className="space-y-1">
            {orderbook.bids.slice(0, 8).map((bid, index) => (
              <div
                key={`bid-${bid.price}-${index}`}
                className="relative flex justify-between items-center text-xs p-1 rounded"
              >
                <div
                  className="absolute inset-0 bg-green-500/10 rounded"
                  style={{
                    width: `${(bid.total / maxTotal) * 100}%`,
                  }}
                />
                <span className="relative z-10 font-mono text-green-600 text-xs">${bid.price.toFixed(2)}</span>
                <span className="relative z-10 font-mono text-xs">{bid.quantity.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {isUsingCachedData ? (
            <div className="space-y-1">
              <p className="flex items-center justify-center">
                <Database className="h-3 w-3 mr-1" />
                Using cached orderbook data
              </p>
            </div>
          ) : (
            <p className="flex items-center justify-center">
              <Wifi className="h-3 w-3 mr-1" />
              Last updated: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : "Never"}
            </p>
          )}
          {error && <p className="text-yellow-600 mt-1">{error}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
