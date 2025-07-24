"use client"

import type { ViewMode } from "@/types/market"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarHeaderProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  viewMode: ViewMode
}

export function CalendarHeader({ currentMonth, onMonthChange, viewMode }: CalendarHeaderProps) {
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + direction)
    onMonthChange(newDate)
  }

  const formatTitle = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
    }
    return currentMonth.toLocaleDateString("en-US", options)
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold">{formatTitle()}</h2>
        <div className="text-sm text-muted-foreground capitalize">{viewMode} View</div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>
          Today
        </Button>

        <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
