"use client"

import { useState, useEffect } from "react"
import type { ViewMode, TimeRange, MarketData } from "@/types/market"
import { CalendarGrid } from "./calendar-grid"
import { CalendarHeader } from "./calendar-header"
import { CalendarLegend } from "./calendar-legend"
import { Card } from "@/components/ui/card"

interface CalendarViewProps {
  data: MarketData[]
  viewMode: ViewMode
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: Date | null
  selectedRange: TimeRange | null
  onDateSelect: (date: Date) => void
  onRangeSelect: (range: TimeRange) => void
}

export function CalendarView({
  data,
  viewMode,
  currentMonth,
  onMonthChange,
  selectedDate,
  selectedRange,
  onDateSelect,
  onRangeSelect,
}: CalendarViewProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDate) return

      const newDate = new Date(selectedDate)

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          newDate.setDate(newDate.getDate() - 1)
          onDateSelect(newDate)
          break
        case "ArrowRight":
          e.preventDefault()
          newDate.setDate(newDate.getDate() + 1)
          onDateSelect(newDate)
          break
        case "ArrowUp":
          e.preventDefault()
          newDate.setDate(newDate.getDate() - 7)
          onDateSelect(newDate)
          break
        case "ArrowDown":
          e.preventDefault()
          newDate.setDate(newDate.getDate() + 7)
          onDateSelect(newDate)
          break
        case "Escape":
          e.preventDefault()
          onDateSelect(null as any)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedDate, onDateSelect])

  return (
    <Card className="p-6">
      <CalendarHeader currentMonth={currentMonth} onMonthChange={onMonthChange} viewMode={viewMode} />

      <CalendarLegend viewMode={viewMode} />

      <CalendarGrid
        data={data}
        viewMode={viewMode}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        selectedRange={selectedRange}
        hoveredDate={hoveredDate}
        onDateSelect={onDateSelect}
        onRangeSelect={onRangeSelect}
        onDateHover={setHoveredDate}
      />

      <div className="mt-4 text-xs text-muted-foreground">
        <p>Use arrow keys to navigate, click to select, drag to select range</p>
      </div>
    </Card>
  )
}
