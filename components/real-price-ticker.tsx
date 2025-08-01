"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, RefreshCw, Wifi, Database, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRealPriceTicker } from "@/hooks/use-real-price-ticker"

interface RealPriceTickerProps {
  symbol: string
}

export function RealPriceTicker({ symbol }: RealPriceTickerProps) {
  const { ticker, loading, error, isConnected, dataSource, refetch } = useRealPriceTicker({ symbol })

  const [priceDirection, setPriceDirection] = useState<"up" | "down" | "neutral">("neutral")
  const prevPriceRef = useRef<number | null>(null)

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

  if (loading && !ticker) {
    return (
      <Card className="w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Loading real-time price data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !ticker) {
    return (
      <Card className="w-full border-yellow-200">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">API Connection Failed</span>
            </div>
            <Button size="sm" variant="outline" onClick={refetch}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
          <p className="text-xs text-yellow-600 mt-2">{error}</p>
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

  const getSourceBadge = () => {
    const sourceColors = {
      binance: "bg-yellow-500",
      coingecko: "bg-green-500",
      coincap: "bg-blue-500",
      "binance-ws": "bg-yellow-600",
      "fallback-demo": "bg-gray-500",
    }

    const color = sourceColors[dataSource as keyof typeof sourceColors] || "bg-gray-500"

    return (
      <Badge variant={isConnected ? "default" : "secondary"} className={`text-xs ${isConnected ? color : ""}`}>
        {isConnected ? (
          <>
            <Wifi className="h-2 w-2 mr-1" />
            {dataSource.toUpperCase()}
          </>
        ) : (
          <>
            <Database className="h-2 w-2 mr-1" />
            DEMO
          </>
        )}
      </Badge>
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
                {getSourceBadge()}
                <Badge variant="outline" className="text-xs text-green-600">
                  {isConnected ? "LIVE" : "DEMO"}
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
              onClick={refetch}
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
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3 inline mr-1" />
                Live data from {dataSource} • Last update: {new Date(ticker.timestamp).toLocaleTimeString()}
              </>
            ) : (
              <>
                <Database className="h-3 w-3 inline mr-1" />
                Demo data - Enable real API in environment variables
              </>
            )}
          </p>
          {error && <p className="text-xs text-yellow-600 mt-1">{error}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
