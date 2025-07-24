"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, TrendingUp } from "lucide-react"

interface MarketStatusProps {
  symbol: string
}

export function MarketStatus({ symbol }: MarketStatusProps) {
  const [serverTime, setServerTime] = useState<Date | null>(null)
  const [isMarketOpen, setIsMarketOpen] = useState(true) // Crypto markets are always open

  useEffect(() => {
    // Fetch Binance server time
    const fetchServerTime = async () => {
      try {
        const response = await fetch("https://api.binance.com/api/v3/time")
        const data = await response.json()
        setServerTime(new Date(data.serverTime))
      } catch (error) {
        console.error("Error fetching server time:", error)
        setServerTime(new Date()) // Fallback to local time
      }
    }

    fetchServerTime()
    const interval = setInterval(fetchServerTime, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <Activity className="h-4 w-4 text-green-500" />
        <Badge variant="default" className="bg-green-500">
          Market Open
        </Badge>
      </div>

      {serverTime && (
        <div className="flex items-center space-x-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Server Time: {serverTime.toLocaleTimeString()}</span>
        </div>
      )}

      <div className="flex items-center space-x-1 text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span>24/7 Trading</span>
      </div>
    </div>
  )
}
