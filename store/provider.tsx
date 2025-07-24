"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Provider } from "react-redux"
import { store } from "./store"
import { Loader2 } from "lucide-react"

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Simulate hydration delay to ensure localStorage is available
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    )
  }

  return <Provider store={store}>{children}</Provider>
}
