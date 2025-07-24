"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, RefreshCw, Wifi, Database } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/hooks/use-app-selector"
import { useAppDispatch } from "@/hooks/use-app-dispatch"
import { fetchTickerData, updateTickerRealTime } from "@/store/slices/priceTickerSlice"

interface PriceTickerProps {
  symbol: string
}

export function PriceTicker({ symbol }: PriceTickerProps) {
  const dispatch = useAppDispatch()
  const { tickers, loading, error, isUsingCachedData, lastUpdate } = useAppSelector((state) => state.priceTicker)

  const [priceDirection, setPriceDirection] = useState<"up" | "down" | "neutral">("neutral")
  const prevPriceRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const ticker = tickers[symbol]
  const lastUpdateTime = lastUpdate[symbol]

  // Initial fetch
  useEffect(() => {
    dispatch(fetchTickerData({ symbol }))
  }, [dispatch, symbol])

  // Real-time updates
  useEffect(() => {
    if (!ticker) return

    const startRealTimeUpdates = () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }

      const updateInterval = 3000 + Math.random() * 5000 // 3-8 seconds
      updateIntervalRef.current = setInterval(() => {
        dispatch(updateTickerRealTime({ symbol }))
      }, updateInterval)
    }

    startRealTimeUpdates()

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [dispatch, symbol])

  // Price direction animation
  useEffect(() => {
    if (ticker && prevPriceRef.current !== null) {
      if (ticker.price > prevPriceRef.current) {
        setPriceDirection("up")
      } else if (ticker.price < prevPriceRef.current) {
        setPriceDirection("down")
      }

      const timer = setTimeout(() => setPriceDirection("neutral"), 1000)
      return () => clearTimeout(timer)
    }

    if (ticker) {
      prevPriceRef.current = ticker.price
    }
  }, [ticker])

  const handleManualRefresh = () => {
    dispatch(fetchTickerData({ symbol }))
  }

  if (loading && !ticker) {
    return (
      <Card className="w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Loading price data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ticker) {
    return (
      <Card className="w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-center">
            <Activity className="h-4 w-4 animate-pulse mr-2" />
            <span className="text-sm">Initializing price feed...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-bold text-base sm:text-lg">{symbol}</span>
                <Badge variant={isUsingCachedData ? "secondary" : "default"} className="text-xs">
                  {isUsingCachedData ? (
                    <>
                      <Database className="h-2 w-2 mr-1" />
                      CACHED
                    </>
                  ) : (
                    <>
                      <Wifi className="h-2 w-2 mr-1" />
                      LIVE
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="text-xs text-green-600">
                  REAL-TIME
                </Badge>
              </div>
              <div
                className={cn(
                  "text-xl sm:text-2xl font-bold transition-all duration-500",
                  priceDirection === "up" && "text-green-500 scale-105",
                  priceDirection === "down" && "text-red-500 scale-105",
                )}
              >
                ${ticker.price.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-4">
            <div className="text-right">
              <div className="flex items-center space-x-1">
                {ticker.priceChangePercent > 0 ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                )}
                <span
                  className={cn(
                    "font-medium text-sm sm:text-base transition-colors duration-300",
                    ticker.priceChangePercent > 0 ? "text-green-500" : "text-red-500",
                    priceDirection === "up" && "text-green-600",
                    priceDirection === "down" && "text-red-600",
                  )}
                >
                  {ticker.priceChangePercent > 0 ? "+" : ""}
                  {ticker.priceChangePercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {ticker.priceChange > 0 ? "+" : ""}${ticker.priceChange.toFixed(2)}
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualRefresh}
              disabled={loading}
              className="opacity-70 hover:opacity-100"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">24h High</div>
            <div className="font-medium text-sm text-green-600">${ticker.high.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">24h Low</div>
            <div className="font-medium text-sm text-red-600">${ticker.low.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">24h Volume</div>
            <div className="font-medium text-sm">
              {ticker.volume > 1000000000
                ? `${(ticker.volume / 1000000000).toFixed(1)}B`
                : ticker.volume > 1000000
                  ? `${(ticker.volume / 1000000).toFixed(1)}M`
                  : `${(ticker.volume / 1000).toFixed(0)}K`}
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-3 p-2 bg-muted/50 rounded text-center">
          <p className="text-xs text-muted-foreground">
            {isUsingCachedData ? (
              <>
                <Database className="h-3 w-3 inline mr-1" />
                Using cached data - API temporarily unavailable
              </>
            ) : (
              <>
                <Wifi className="h-3 w-3 inline mr-1" />
                Live data • Last update: {lastUpdateTime ? new Date(lastUpdateTime).toLocaleTimeString() : "Never"}
              </>
            )}
          </p>
          {error && <p className="text-xs text-yellow-600 mt-1">{error}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
