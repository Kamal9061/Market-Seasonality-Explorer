"use client"

import type { ViewMode, TimeRange, MarketData } from "@/types/market"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Zap } from "lucide-react"
import { MetricsChart } from "./metrics-chart"

interface DataDashboardProps {
  selectedDate: Date | null
  selectedRange: TimeRange | null
  data: MarketData[]
  symbol: string
  viewMode: ViewMode
}

export function DataDashboard({ selectedDate, selectedRange, data, symbol, viewMode }: DataDashboardProps) {
  const getSelectedData = (): MarketData[] => {
    if (!data || data.length === 0) return []

    if (selectedDate) {
      const dayData = data.find((d) => d.date.toDateString() === selectedDate.toDateString())
      return dayData ? [dayData] : []
    }

    if (selectedRange) {
      return data.filter((d) => d.date >= selectedRange.start && d.date <= selectedRange.end)
    }

    // Return last 7 days by default, or all available data if less than 7 days
    return data.slice(-Math.min(7, data.length))
  }

  const selectedData = getSelectedData()
  const currentData = selectedData.length > 0 ? selectedData[selectedData.length - 1] : null

  const calculateAggregates = () => {
    if (selectedData.length === 0) return null

    const totalVolume = selectedData.reduce((sum, d) => sum + (d.volume || 0), 0)
    const avgVolatility = selectedData.reduce((sum, d) => sum + (d.volatility || 0), 0) / selectedData.length
    const totalReturn = selectedData.reduce((sum, d) => sum + (d.priceChange || 0), 0)
    const maxPrice = Math.max(...selectedData.map((d) => d.high || d.price))
    const minPrice = Math.min(...selectedData.map((d) => d.low || d.price))

    return {
      totalVolume,
      avgVolatility,
      totalReturn,
      maxPrice,
      minPrice,
      dataPoints: selectedData.length,
    }
  }

  const aggregates = calculateAggregates()

  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Market Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Loading market data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentData && !aggregates) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Market Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select a date or range to view detailed analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 w-full">
      {/* Current Selection Info */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Market Analytics</span>
            </div>
            <Badge variant="outline" className="text-xs w-fit">
              {symbol}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {selectedDate && (
              <div>
                <h3 className="font-medium mb-2 text-sm">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
              </div>
            )}

            {selectedRange && (
              <div>
                <h3 className="font-medium mb-2 text-sm">
                  Range: {selectedRange.start.toLocaleDateString()} - {selectedRange.end.toLocaleDateString()}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {selectedData.length} days
                </Badge>
              </div>
            )}

            {!selectedDate && !selectedRange && (
              <div>
                <h3 className="font-medium mb-2 text-sm">Recent Data</h3>
                <Badge variant="secondary" className="text-xs">
                  Last {selectedData.length} days
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            {currentData && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Price</span>
                  </div>
                  <div className="text-lg font-bold">${currentData.price.toFixed(2)}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    {currentData.priceChange > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className="text-xs text-muted-foreground">Change</span>
                  </div>
                  <div
                    className={`text-lg font-bold ${currentData.priceChange > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {currentData.priceChange > 0 ? "+" : ""}
                    {(currentData.priceChange * 100).toFixed(2)}%
                  </div>
                </div>
              </>
            )}

            {aggregates && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Avg Volatility</span>
                  </div>
                  <div className="text-lg font-bold">{(aggregates.avgVolatility * 100).toFixed(2)}%</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total Volume</span>
                  </div>
                  <div className="text-lg font-bold">${(aggregates.totalVolume / 1000000).toFixed(1)}M</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {selectedData.length > 1 && (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Price Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-48">
              <MetricsChart data={selectedData} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      {currentData && (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Detailed Metrics</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Open</span>
                <span className="font-medium">${currentData.open.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High</span>
                <span className="font-medium text-green-600">${currentData.high.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low</span>
                <span className="font-medium text-red-600">${currentData.low.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Close</span>
                <span className="font-medium">${currentData.price.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volume</span>
                <span className="font-medium">${(currentData.volume / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Volatility</span>
                <span className="font-medium">{(currentData.volatility * 100).toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Analysis */}
      {aggregates && (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Technical Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Range</span>
                <span className="font-medium">
                  ${aggregates.minPrice.toFixed(2)} - ${aggregates.maxPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Return</span>
                <span className={`font-medium ${aggregates.totalReturn > 0 ? "text-green-600" : "text-red-600"}`}>
                  {aggregates.totalReturn > 0 ? "+" : ""}
                  {(aggregates.totalReturn * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data Points</span>
                <span className="font-medium">{aggregates.dataPoints} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
