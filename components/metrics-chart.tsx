"use client"

import type { MarketData } from "@/types/market"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  ComposedChart,
} from "recharts"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TrendingUp, BarChart3, Activity, Volume2 } from "lucide-react"

interface MetricsChartProps {
  data: MarketData[]
  chartType?: "area" | "line" | "bar" | "composed"
}

export function MetricsChart({ data, chartType = "area" }: MetricsChartProps) {
  const [activeChart, setActiveChart] = useState<"price" | "volume" | "volatility" | "combined">("price")

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
        <Activity className="h-8 w-8 opacity-50" />
        <p className="text-sm">No data available for chart</p>
        <p className="text-xs">Select a date range to view price trends</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    date: d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    fullDate: d.date.toISOString(),
    price: Number(d.price.toFixed(2)),
    volume: Number((d.volume / 1000000).toFixed(2)), // Convert to millions
    volatility: Number((d.volatility * 100).toFixed(2)), // Convert to percentage
    high: Number(d.high.toFixed(2)),
    low: Number(d.low.toFixed(2)),
    change: Number((d.priceChange * 100).toFixed(2)),
  }))

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
    }

    switch (activeChart) {
      case "price":
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              fontSize={10}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis fontSize={10} tick={{ fontSize: 10 }} width={40} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any, name: string) => {
                if (name === "price") return [`$${value}`, "Price"]
                if (name === "high") return [`$${value}`, "High"]
                if (name === "low") return [`$${value}`, "Low"]
                return [value, name]
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="high"
              stroke="hsl(var(--chart-2))"
              fill="transparent"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="low"
              stroke="hsl(var(--chart-3))"
              fill="transparent"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
          </AreaChart>
        )

      case "volume":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              fontSize={10}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis fontSize={10} tick={{ fontSize: 10 }} width={40} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any) => [`${value}M`, "Volume"]}
            />
            <Bar dataKey="volume" fill="hsl(var(--chart-4))" opacity={0.8} radius={[2, 2, 0, 0]} />
          </BarChart>
        )

      case "volatility":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              fontSize={10}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis fontSize={10} tick={{ fontSize: 10 }} width={40} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any) => [`${value}%`, "Volatility"]}
            />
            <Line
              type="monotone"
              dataKey="volatility"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--chart-5))" }}
              activeDot={{ r: 4, fill: "hsl(var(--chart-5))" }}
            />
          </LineChart>
        )

      case "combined":
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              fontSize={10}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              axisLine={false}
              tickLine={false}
            />
            <YAxis yAxisId="price" fontSize={10} tick={{ fontSize: 10 }} width={40} axisLine={false} tickLine={false} />
            <YAxis
              yAxisId="volume"
              orientation="right"
              fontSize={10}
              tick={{ fontSize: 10 }}
              width={40}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any, name: string) => {
                if (name === "price") return [`$${value}`, "Price"]
                if (name === "volume") return [`${value}M`, "Volume"]
                return [value, name]
              }}
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Bar yAxisId="volume" dataKey="volume" fill="hsl(var(--chart-4))" opacity={0.3} radius={[1, 1, 0, 0]} />
          </ComposedChart>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={activeChart === "price" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveChart("price")}
          className="text-xs h-7 px-2"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          Price
        </Button>
        <Button
          variant={activeChart === "volume" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveChart("volume")}
          className="text-xs h-7 px-2"
        >
          <Volume2 className="h-3 w-3 mr-1" />
          Volume
        </Button>
        <Button
          variant={activeChart === "volatility" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveChart("volatility")}
          className="text-xs h-7 px-2"
        >
          <Activity className="h-3 w-3 mr-1" />
          Volatility
        </Button>
        <Button
          variant={activeChart === "combined" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveChart("combined")}
          className="text-xs h-7 px-2"
        >
          <BarChart3 className="h-3 w-3 mr-1" />
          Combined
        </Button>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="text-xs text-muted-foreground text-center">
        Showing {chartData.length} data points • {activeChart.charAt(0).toUpperCase() + activeChart.slice(1)} view
      </div>
    </div>
  )
}
