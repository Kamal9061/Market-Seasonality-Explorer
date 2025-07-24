import type { ViewMode } from "@/types/market"

interface CalendarLegendProps {
  viewMode: ViewMode
}

export function CalendarLegend({ viewMode }: CalendarLegendProps) {
  return (
    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Volatility:</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-medium">Performance:</span>
          <div className="flex items-center space-x-1">
            <span className="text-green-600">↑</span>
            <span>Positive</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-red-600">↓</span>
            <span>Negative</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-medium">Volume:</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-blue-500"></div>
            <span>Liquidity</span>
          </div>
        </div>
      </div>
    </div>
  )
}
