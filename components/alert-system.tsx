"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, AlertTriangle, X, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { MarketData } from "@/types/market"

interface Alert {
  id: string
  type: "volatility" | "price" | "volume"
  condition: "above" | "below"
  threshold: number
  symbol: string
  isActive: boolean
  triggered: boolean
  createdAt: Date
}

interface AlertSystemProps {
  data: MarketData[]
  symbol: string
}

export function AlertSystem({ data, symbol }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAddAlert, setShowAddAlert] = useState(false)
  const { toast } = useToast()

  // Check alerts against current data
  useEffect(() => {
    if (!data || data.length === 0) return

    const latestData = data[data.length - 1]

    alerts.forEach((alert) => {
      if (!alert.isActive || alert.triggered) return

      let shouldTrigger = false
      let currentValue = 0
      let valueLabel = ""

      switch (alert.type) {
        case "volatility":
          currentValue = latestData.volatility * 100
          valueLabel = "Volatility"
          break
        case "price":
          currentValue = latestData.price
          valueLabel = "Price"
          break
        case "volume":
          currentValue = latestData.volume / 1000000
          valueLabel = "Volume"
          break
      }

      if (alert.condition === "above" && currentValue > alert.threshold) {
        shouldTrigger = true
      } else if (alert.condition === "below" && currentValue < alert.threshold) {
        shouldTrigger = true
      }

      if (shouldTrigger) {
        // Trigger alert
        setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, triggered: true } : a)))

        toast({
          title: "🚨 Alert Triggered!",
          description: `${valueLabel} is ${alert.condition} ${alert.threshold}${alert.type === "volatility" ? "%" : alert.type === "volume" ? "M" : ""}`,
          variant: "destructive",
        })
      }
    })
  }, [data, alerts, toast])

  const addAlert = (type: Alert["type"], condition: Alert["condition"], threshold: number) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      type,
      condition,
      threshold,
      symbol,
      isActive: true,
      triggered: false,
      createdAt: new Date(),
    }

    setAlerts((prev) => [...prev, newAlert])
    setShowAddAlert(false)

    toast({
      title: "Alert Created",
      description: `You'll be notified when ${type} goes ${condition} ${threshold}`,
    })
  }

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const toggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive, triggered: false } : a)))
  }

  const activeAlerts = alerts.filter((a) => a.isActive && !a.triggered)
  const triggeredAlerts = alerts.filter((a) => a.triggered)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Price Alerts</span>
            {(activeAlerts.length > 0 || triggeredAlerts.length > 0) && (
              <Badge variant="secondary" className="text-xs">
                {activeAlerts.length + triggeredAlerts.length}
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddAlert(!showAddAlert)} className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Alert
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Add Alert Form */}
        {showAddAlert && (
          <div className="p-3 border rounded-lg space-y-3">
            <h4 className="text-sm font-medium">Create New Alert</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addAlert("volatility", "above", 5)}
                className="text-xs"
              >
                High Volatility (5%)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addAlert("price", "above", data[data.length - 1]?.price * 1.05 || 50000)}
                className="text-xs"
              >
                Price +5%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addAlert("price", "below", data[data.length - 1]?.price * 0.95 || 45000)}
                className="text-xs"
              >
                Price -5%
              </Button>
              <Button size="sm" variant="outline" onClick={() => addAlert("volume", "above", 1000)} className="text-xs">
                High Volume (1B)
              </Button>
            </div>
          </div>
        )}

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Triggered Alerts
            </h4>
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-2 bg-destructive/10 border border-destructive/20 rounded"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <span className="text-xs">
                    {alert.type} {alert.condition} {alert.threshold}
                    {alert.type === "volatility" ? "%" : alert.type === "volume" ? "M" : ""}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeAlert(alert.id)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Active Alerts</h4>
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center space-x-2">
                  <Bell className="h-3 w-3" />
                  <span className="text-xs">
                    {alert.type} {alert.condition} {alert.threshold}
                    {alert.type === "volatility" ? "%" : alert.type === "volume" ? "M" : ""}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleAlert(alert.id)} className="h-6 w-6 p-0">
                    <Bell className={`h-3 w-3 ${alert.isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeAlert(alert.id)} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {alerts.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts set</p>
            <p className="text-xs">Create alerts to get notified of market events</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
