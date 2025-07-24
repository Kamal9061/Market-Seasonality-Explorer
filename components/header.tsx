import { TrendingUp } from "lucide-react"
import { MarketStatus } from "./market-status"

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Market Seasonality Explorer</h1>
            </div>
          </div>

          <MarketStatus symbol="BTCUSDT" />
        </div>
      </div>
    </header>
  )
}
