"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Settings, Palette, Clock, Bell, Download } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface SettingsDialogProps {
  children: React.ReactNode
}

export interface AppSettings {
  theme: "light" | "dark" | "system"
  colorScheme: "default" | "high-contrast" | "colorblind-friendly"
  refreshInterval: number
  enableNotifications: boolean
  enableAnimations: boolean
  autoExport: boolean
  exportFormat: "csv" | "pdf" | "json"
  volatilityThreshold: number
  showTooltips: boolean
}

const defaultSettings: AppSettings = {
  theme: "light",
  colorScheme: "default",
  refreshInterval: 60,
  enableNotifications: true,
  enableAnimations: true,
  autoExport: false,
  exportFormat: "csv",
  volatilityThreshold: 5,
  showTooltips: true,
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isOpen, setIsOpen] = useState(false)

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "market-explorer-settings.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Application Settings</span>
          </DialogTitle>
          <DialogDescription>Customize your Market Seasonality Explorer experience</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Appearance Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <h3 className="text-lg font-medium">Appearance</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value: any) => updateSetting("theme", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorScheme">Color Scheme</Label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value: any) => updateSetting("colorScheme", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="high-contrast">High Contrast</SelectItem>
                    <SelectItem value="colorblind-friendly">Colorblind Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Animations</Label>
                <p className="text-sm text-muted-foreground">Smooth transitions and effects</p>
              </div>
              <Switch
                checked={settings.enableAnimations}
                onCheckedChange={(checked) => updateSetting("enableAnimations", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Tooltips</Label>
                <p className="text-sm text-muted-foreground">Display helpful tooltips on hover</p>
              </div>
              <Switch
                checked={settings.showTooltips}
                onCheckedChange={(checked) => updateSetting("showTooltips", checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Data & Performance Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <h3 className="text-lg font-medium">Data & Performance</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Refresh Interval: {settings.refreshInterval} seconds</Label>
                <Slider
                  value={[settings.refreshInterval]}
                  onValueChange={([value]) => updateSetting("refreshInterval", value)}
                  min={30}
                  max={300}
                  step={30}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">How often to fetch new market data (30s - 5min)</p>
              </div>

              <div className="space-y-2">
                <Label>Volatility Alert Threshold: {settings.volatilityThreshold}%</Label>
                <Slider
                  value={[settings.volatilityThreshold]}
                  onValueChange={([value]) => updateSetting("volatilityThreshold", value)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Get notified when volatility exceeds this threshold</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notifications & Alerts */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <h3 className="text-lg font-medium">Notifications & Alerts</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Get alerts for market events</p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => updateSetting("enableNotifications", checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Export Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <h3 className="text-lg font-medium">Export Settings</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Default Export Format</Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value: any) => updateSetting("exportFormat", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Export</Label>
                  <p className="text-sm text-muted-foreground">Automatically export daily data</p>
                </div>
                <Switch
                  checked={settings.autoExport}
                  onCheckedChange={(checked) => updateSetting("autoExport", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <div className="space-x-2">
            <Button variant="outline" onClick={resetSettings}>
              Reset to Defaults
            </Button>
            <Button variant="outline" onClick={exportSettings}>
              Export Settings
            </Button>
          </div>
          <Button onClick={() => setIsOpen(false)}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
