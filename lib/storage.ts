"use client"

import { useState } from "react"

export interface StorageConfig {
  key: string
  storage: Storage
  whitelist?: string[]
}

export class CustomStorage {
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
  }

  // Save state to localStorage
  saveState(state: any): void {
    try {
      const serializedState = JSON.stringify(state)
      this.config.storage.setItem(this.config.key, serializedState)
    } catch (error) {
      console.warn("Failed to save state to storage:", error)
    }
  }

  // Load state from localStorage
  loadState(): any {
    try {
      const serializedState = this.config.storage.getItem(this.config.key)
      if (serializedState === null) {
        return undefined
      }
      return JSON.parse(serializedState)
    } catch (error) {
      console.warn("Failed to load state from storage:", error)
      return undefined
    }
  }

  // Clear stored state
  clearState(): void {
    try {
      this.config.storage.removeItem(this.config.key)
    } catch (error) {
      console.warn("Failed to clear state from storage:", error)
    }
  }
}

// Create storage instance - properly exported
export const appStorage =
  typeof window !== "undefined"
    ? new CustomStorage({
        key: "market-explorer-state",
        storage: window.localStorage,
      })
    : new CustomStorage({
        key: "market-explorer-state",
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          length: 0,
          key: () => null,
        },
      })

// Storage hooks for React components
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
}

// Utility function to check if storage is available
export const isStorageAvailable = (): boolean => {
  if (typeof window === "undefined") return false

  try {
    const test = "__storage_test__"
    window.localStorage.setItem(test, test)
    window.localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Export storage utilities
export const storageUtils = {
  save: (key: string, data: any) => {
    if (!isStorageAvailable()) return false
    try {
      window.localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  },

  load: (key: string) => {
    if (!isStorageAvailable()) return null
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },

  remove: (key: string) => {
    if (!isStorageAvailable()) return false
    try {
      window.localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },

  clear: () => {
    if (!isStorageAvailable()) return false
    try {
      window.localStorage.clear()
      return true
    } catch {
      return false
    }
  },
}
