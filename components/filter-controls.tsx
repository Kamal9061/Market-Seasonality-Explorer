"use client"

import { useState } from "react"
import type { ViewMode } from "@/types/market"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Settings, Wifi, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { SettingsDialog } from "./settings-dialog"

interface FilterControlsProps {
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onRefresh: () => void
  data?: any[]
}

const CRYPTO_SYMBOLS = [
  { value: "BTCUSDT", label: "Bitcoin (BTC/USDT)" },
  { value: "ETHUSDT", label: "Ethereum (ETH/USDT)" },
  { value: "ADAUSDT", label: "Cardano (ADA/USDT)" },
  { value: "SOLUSDT", label: "Solana (SOL/USDT)" },
  { value: "DOTUSDT", label: "Polkadot (DOT/USDT)" },
]

export function FilterControls({
  selectedSymbol,
  onSymbolChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  data = [],
}: FilterControlsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      toast({
        title: "Data Refreshed",
        description: "Market data has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh market data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (!data || data.length === 0) {
        toast({
          title: "No Data to Export",
          description: "Please wait for data to load before exporting.",
          variant: "destructive",
        })
        return
      }

      // Create CSV content
      const headers = ["Date", "Price", "Open", "High", "Low", "Volume", "Price Change %", "Volatility %"]
      const csvContent = [
        headers.join(","),
        ...data.map((item) =>
          [
            item.date.toISOString().split("T")[0],
            item.price.toFixed(2),
            item.open.toFixed(2),
            item.high.toFixed(2),
            item.low.toFixed(2),
            item.volume.toFixed(0),
            (item.priceChange * 100).toFixed(2),
            (item.volatility * 100).toFixed(2),
          ].join(","),
        ),
      ].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `${selectedSymbol}_${viewMode}_data_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: `${data.length} records exported to CSV file.`,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 bg-card rounded-lg border">
      {/* Top row - Symbol and View controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex items-center space-x-2 min-w-0">
          <label className="text-sm font-medium whitespace-nowrap">Symbol:</label>
          <Select value={selectedSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRYPTO_SYMBOLS.map((symbol) => (
                <SelectItem key={symbol.value} value={symbol.value}>
                  <span className="block sm:hidden">{symbol.value}</span>
                  <span className="hidden sm:block">{symbol.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 min-w-0">
          <label className="text-sm font-medium whitespace-nowrap">View:</label>
          <div className="flex space-x-1">
            {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => onViewModeChange(mode)}
                className="capitalize text-xs sm:text-sm px-2 sm:px-3"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row - Status badges and action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Wifi className="w-2 h-2 mr-1" />
            CoinGecko API
          </Badge>
          <Badge variant="outline" className="text-xs">
            Real-time Data
          </Badge>
          {data && data.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {data.length} records
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs sm:text-sm bg-transparent"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || !data || data.length === 0}
            className="text-xs sm:text-sm bg-transparent"
          >
            <FileDown className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isExporting ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">CSV</span>
          </Button>

          <SettingsDialog>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-transparent">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Settings</span>
            </Button>
          </SettingsDialog>
        </div>
      </div>
    </div>
  )
}
