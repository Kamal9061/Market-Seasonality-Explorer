"use client"

import { useState } from "react"
import { CalendarView } from "@/components/calendar-view"
import { DataDashboard } from "@/components/data-dashboard"
import { FilterControls } from "@/components/filter-controls"
import { Header } from "@/components/header"
import { useFreeMarketData } from "@/hooks/use-free-market-data"
import { useFreeOrderbook } from "@/hooks/use-free-orderbook"
import type { ViewMode, TimeRange } from "@/types/market"
import { Loader2, AlertCircle, CheckCircle, Wifi } from "lucide-react"
import { FreePriceTicker } from "@/components/free-price-ticker"
import { OrderbookPanel } from "@/components/orderbook-panel"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
import { AlertSystem } from "@/components/alert-system"
import { isAPIEnabled } from "@/lib/free-api-client"

export default function MarketSeasonalityExplorer() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily")
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedRange, setSelectedRange] = useState<TimeRange | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const { data, loading, error, refetch, connectionStatus, dataSource } = useFreeMarketData({
    symbol: selectedSymbol,
    viewMode,
    month: currentMonth,
  })

  const { orderbook } = useFreeOrderbook({ symbol: selectedSymbol })

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedRange(null)
  }

  const handleRangeSelect = (range: TimeRange) => {
    setSelectedRange(range)
    setSelectedDate(null)
  }

  // Get current price from the latest data point
  const currentPrice = data.length > 0 ? data[data.length - 1].price : undefined

  // API Status Banner
  const renderAPIStatusBanner = () => {
    if (!isAPIEnabled()) {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <span className="text-sm text-yellow-800">
              Real API is disabled. Enable NEXT_PUBLIC_USE_REAL_API="true" in your .env.local file for live data.
            </span>
            <Badge variant="outline" className="text-xs">
              DEMO MODE
            </Badge>
          </div>
        </div>
      )
    }

    if (connectionStatus === "connected" && dataSource !== "fallback-demo") {
      return (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-800">
              Connected to {dataSource.toUpperCase()} FREE API - Real cryptocurrency data (No keys required)
            </span>
            <Badge variant="default" className="text-xs bg-green-600">
              FREE API DATA
            </Badge>
          </div>
        </div>
      )
    }

    if (connectionStatus === "polling") {
      return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-800">
              Polling {dataSource.toUpperCase()} FREE API for updates (every 60 seconds)
            </span>
            <Badge variant="outline" className="text-xs">
              FREE POLLING
            </Badge>
          </div>
        </div>
      )
    }

    if (error && dataSource === "fallback-demo") {
      return (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm text-orange-800">
              Free APIs temporarily unavailable. Using demo data. No API keys or registration required.
            </span>
            <Badge variant="outline" className="text-xs">
              FALLBACK
            </Badge>
          </div>
        </div>
      )
    }

    return null
  }

  if (error && data.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-destructive mb-2">Connection Error</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Unable to connect to free cryptocurrency APIs. Check your internet connection.
            </p>
            <p className="text-xs text-green-600">
              ✅ No API keys required - Using CoinGecko, CoinCap, and CryptoCompare free tiers
            </p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Filter Controls */}
        <div className="mb-4 sm:mb-6">
          <FilterControls
            selectedSymbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRefresh={refetch}
            data={data}
          />
        </div>

        {/* API Status Banner */}
        {renderAPIStatusBanner()}

        {/* Price Ticker - Full width */}
        <div className="mb-4 sm:mb-6">
          <FreePriceTicker symbol={selectedSymbol} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
          {/* Calendar View - Takes more space on larger screens */}
          <div className="xl:col-span-8">
            {loading && data.length === 0 ? (
              <div className="flex items-center justify-center h-64 sm:h-96 border rounded-lg bg-card">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2" />
                  <span className="text-sm sm:text-base">Loading real market data from FREE APIs...</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connecting to {isAPIEnabled() ? "CoinGecko, CoinCap, CryptoCompare" : "demo data"}...
                  </p>
                  <p className="text-xs text-green-600 mt-1">✅ No API keys required</p>
                </div>
              </div>
            ) : (
              <CalendarView
                data={data}
                viewMode={viewMode}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                selectedDate={selectedDate}
                selectedRange={selectedRange}
                onDateSelect={handleDateSelect}
                onRangeSelect={handleRangeSelect}
              />
            )}
          </div>

          {/* Right sidebar with Dashboard and other components */}
          <div className="xl:col-span-4">
            <div className="space-y-4 sm:space-y-6 h-full">
              {/* Data Dashboard */}
              <div className="min-h-0">
                <DataDashboard
                  selectedDate={selectedDate}
                  selectedRange={selectedRange}
                  data={data}
                  symbol={selectedSymbol}
                  viewMode={viewMode}
                />
              </div>

              {/* Orderbook Panel */}
              <div className="min-h-0">
                <OrderbookPanel symbol={selectedSymbol} currentPrice={currentPrice} />
              </div>

              {/* Alert System */}
              <div className="min-h-0">
                <AlertSystem data={data} symbol={selectedSymbol} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with API Information */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-2">
            🚀 <strong>FREE Cryptocurrency Data</strong> - No API keys or registration required
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              CoinGecko API
            </Badge>
            <Badge variant="outline" className="bg-blue-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              CoinCap API
            </Badge>
            <Badge variant="outline" className="bg-purple-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              CryptoCompare API
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Real-time cryptocurrency market data with automatic fallback and caching
          </p>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
