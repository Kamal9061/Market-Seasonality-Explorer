"use client"

import { useState } from "react"
import type { ViewMode, TimeRange, MarketData } from "@/types/market"
import { CalendarCell } from "./calendar-cell"

interface CalendarGridProps {
  data: MarketData[]
  viewMode: ViewMode
  currentMonth: Date
  selectedDate: Date | null
  selectedRange: TimeRange | null
  hoveredDate: Date | null
  onDateSelect: (date: Date) => void
  onRangeSelect: (range: TimeRange) => void
  onDateHover: (date: Date | null) => void
}

export function CalendarGrid({
  data,
  viewMode,
  currentMonth,
  selectedDate,
  selectedRange,
  hoveredDate,
  onDateSelect,
  onRangeSelect,
  onDateHover,
}: CalendarGridProps) {
  const [dragStart, setDragStart] = useState<Date | null>(null)

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: Date[] = []
    const current = new Date(startDate)

    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const getDataForDate = (date: Date): MarketData | undefined => {
    return data.find((d) => d.date.toDateString() === date.toDateString())
  }

  const handleMouseDown = (date: Date) => {
    setDragStart(date)
    onDateSelect(date)
  }

  const handleMouseUp = (date: Date) => {
    if (dragStart && dragStart !== date) {
      const start = dragStart < date ? dragStart : date
      const end = dragStart < date ? date : dragStart
      onRangeSelect({ start, end })
    }
    setDragStart(null)
  }

  const isInRange = (date: Date): boolean => {
    if (!selectedRange) return false
    return date >= selectedRange.start && date <= selectedRange.end
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const days = getDaysInMonth()
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="select-none">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const marketData = getDataForDate(date)
          const isSelected = selectedDate?.toDateString() === date.toDateString()
          const inRange = isInRange(date)
          const today = isToday(date)
          const currentMonth = isCurrentMonth(date)

          return (
            <CalendarCell
              key={index}
              date={date}
              data={marketData}
              viewMode={viewMode}
              isSelected={isSelected}
              isInRange={inRange}
              isToday={today}
              isCurrentMonth={currentMonth}
              isHovered={hoveredDate?.toDateString() === date.toDateString()}
              onMouseDown={() => handleMouseDown(date)}
              onMouseUp={() => handleMouseUp(date)}
              onMouseEnter={() => onDateHover(date)}
              onMouseLeave={() => onDateHover(null)}
            />
          )
        })}
      </div>
    </div>
  )
}
