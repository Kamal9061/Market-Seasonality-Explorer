"use client"

import type { ViewMode, MarketData } from "@/types/market"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface CalendarCellProps {
  date: Date
  data?: MarketData
  viewMode: ViewMode
  isSelected: boolean
  isInRange: boolean
  isToday: boolean
  isCurrentMonth: boolean
  isHovered: boolean
  onMouseDown: () => void
  onMouseUp: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function CalendarCell({
  date,
  data,
  viewMode,
  isSelected,
  isInRange,
  isToday,
  isCurrentMonth,
  isHovered,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  onMouseLeave,
}: CalendarCellProps) {
  const getVolatilityColor = (volatility?: number) => {
    if (!volatility) return "bg-gray-100"
    if (volatility < 0.02) return "bg-green-200"
    if (volatility < 0.05) return "bg-yellow-200"
    return "bg-red-200"
  }

  const getPerformanceIcon = (change?: number) => {
    if (!change) return <Minus className="h-3 w-3 text-gray-400" />
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />
    return <TrendingDown className="h-3 w-3 text-red-600" />
  }

  const formatTooltipContent = () => {
    if (!data) return "No data available"

    return (
      <div className="space-y-1">
        <div className="font-medium">{date.toLocaleDateString()}</div>
        <div>Price: ${data.price.toFixed(2)}</div>
        <div>
          Change: {data.priceChange > 0 ? "+" : ""}
          {(data.priceChange * 100).toFixed(2)}%
        </div>
        <div>Volume: ${(data.volume / 1000000).toFixed(1)}M</div>
        <div>Volatility: {(data.volatility * 100).toFixed(2)}%</div>
        <div>High: ${data.high.toFixed(2)}</div>
        <div>Low: ${data.low.toFixed(2)}</div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative h-16 p-1 border cursor-pointer transition-all duration-200",
              "hover:border-primary/50 hover:shadow-sm",
              isSelected && "border-primary border-2 shadow-md",
              isInRange && "bg-primary/10",
              isToday && "ring-2 ring-primary ring-offset-1",
              !isCurrentMonth && "opacity-40",
              isHovered && "scale-105 z-10",
              getVolatilityColor(data?.volatility),
            )}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {/* Date number */}
            <div className="text-xs font-medium text-foreground">{date.getDate()}</div>

            {/* Performance indicator */}
            <div className="absolute top-1 right-1">{getPerformanceIcon(data?.priceChange)}</div>

            {/* Volume bar */}
            {data && (
              <div className="absolute bottom-1 left-1 right-1">
                <div
                  className="h-1 bg-blue-500 rounded-full opacity-60"
                  style={{
                    width: `${Math.min(100, (data.volume / 1000000000) * 100)}%`,
                  }}
                />
              </div>
            )}

            {/* Price change indicator */}
            {data && (
              <div className="absolute bottom-2 right-1 text-xs">
                <span className={cn("font-medium", data.priceChange > 0 ? "text-green-600" : "text-red-600")}>
                  {data.priceChange > 0 ? "+" : ""}
                  {(data.priceChange * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>{formatTooltipContent()}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
