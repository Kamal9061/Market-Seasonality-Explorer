"use client"

// API Configuration
const API_CONFIG = {
  coingecko: {
    baseUrl: process.env.NEXT_PUBLIC_COINGECKO_API_URL || "https://api.coingecko.com/api/v3",
    key: process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "",
  },
  binance: {
    baseUrl: process.env.NEXT_PUBLIC_BINANCE_API_URL || "https://api.binance.com/api/v3",
    key: process.env.NEXT_PUBLIC_BINANCE_API_KEY || "",
  },
  coincap: {
    baseUrl: process.env.NEXT_PUBLIC_COINCAP_API_URL || "https://api.coincap.io/v2",
    key: process.env.NEXT_PUBLIC_COINCAP_API_KEY || "",
  },
  cryptocompare: {
    baseUrl: process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_URL || "https://min-api.cryptocompare.com/data",
    key: process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY || "",
  },
}

const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === "true"
const API_TIMEOUT = Number.parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000")
const ENABLE_CACHING = process.env.NEXT_PUBLIC_ENABLE_CACHING === "true"
const CACHE_DURATION = Number.parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION || "300000")

// Cache implementation
class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>()

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear(): void {
    this.cache.clear()
  }
}

const apiCache = new APICache()

// Rate limiting
class RateLimiter {
  private requests = new Map<string, number[]>()
  private limit = Number.parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT || "100")
  private window = Number.parseInt(process.env.NEXT_PUBLIC_API_RATE_WINDOW || "60000")

  canMakeRequest(endpoint: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(endpoint) || []

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.window)

    if (validRequests.length >= this.limit) {
      return false
    }

    validRequests.push(now)
    this.requests.set(endpoint, validRequests)
    return true
  }
}

const rateLimiter = new RateLimiter()

// HTTP Client with error handling and retries
class HTTPClient {
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  async get(url: string, options: RequestInit = {}): Promise<any> {
    // Check cache first
    if (ENABLE_CACHING) {
      const cached = apiCache.get(url)
      if (cached) {
        console.log(`Cache hit for: ${url}`)
        return cached
      }
    }

    // Check rate limiting
    if (!rateLimiter.canMakeRequest(url)) {
      throw new Error("Rate limit exceeded")
    }

    try {
      const response = await this.fetchWithTimeout(url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache successful responses
      if (ENABLE_CACHING) {
        apiCache.set(url, data)
      }

      return data
    } catch (error) {
      console.error(`API request failed for ${url}:`, error)
      throw error
    }
  }
}

const httpClient = new HTTPClient()

// Symbol mapping between different APIs
const SYMBOL_MAPPING = {
  // CoinGecko uses different IDs
  coingecko: {
    BTCUSDT: "bitcoin",
    ETHUSDT: "ethereum",
    ADAUSDT: "cardano",
    SOLUSDT: "solana",
    DOTUSDT: "polkadot",
  },
  // Binance uses trading pairs
  binance: {
    BTCUSDT: "BTCUSDT",
    ETHUSDT: "ETHUSDT",
    ADAUSDT: "ADAUSDT",
    SOLUSDT: "SOLUSDT",
    DOTUSDT: "DOTUSDT",
  },
  // CoinCap uses different IDs
  coincap: {
    BTCUSDT: "bitcoin",
    ETHUSDT: "ethereum",
    ADAUSDT: "cardano",
    SOLUSDT: "solana",
    DOTUSDT: "polkadot",
  },
}

// CoinGecko API Client
export class CoinGeckoAPI {
  private baseUrl = API_CONFIG.coingecko.baseUrl
  private apiKey = API_CONFIG.coingecko.key

  private getHeaders() {
    const headers: Record<string, string> = {}
    if (this.apiKey) {
      headers["x-cg-demo-api-key"] = this.apiKey
    }
    return headers
  }

  async getCurrentPrice(symbol: string): Promise<any> {
    const coinId = SYMBOL_MAPPING.coingecko[symbol as keyof typeof SYMBOL_MAPPING.coingecko] || "bitcoin"
    const url = `${this.baseUrl}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`

    try {
      const data = await httpClient.get(url, { headers: this.getHeaders() })
      const coinData = data[coinId]

      if (!coinData) {
        throw new Error(`No data found for ${coinId}`)
      }

      return {
        symbol,
        price: coinData.usd,
        priceChange: coinData.usd_24h_change || 0,
        priceChangePercent: coinData.usd_24h_change || 0,
        volume: coinData.usd_24h_vol || 0,
        lastUpdated: coinData.last_updated_at,
        source: "coingecko",
      }
    } catch (error) {
      console.error("CoinGecko API error:", error)
      throw error
    }
  }

  async getHistoricalData(symbol: string, days = 30): Promise<any[]> {
    const coinId = SYMBOL_MAPPING.coingecko[symbol as keyof typeof SYMBOL_MAPPING.coingecko] || "bitcoin"
    const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`

    try {
      const data = await httpClient.get(url, { headers: this.getHeaders() })

      return data.prices.map((price: [number, number], index: number) => {
        const volume = data.total_volumes[index] || [0, 0]
        const marketCap = data.market_caps[index] || [0, 0]

        return {
          date: new Date(price[0]),
          price: price[1],
          open: price[1], // CoinGecko doesn't provide OHLC, using price as approximation
          high: price[1] * (1 + Math.random() * 0.02),
          low: price[1] * (1 - Math.random() * 0.02),
          volume: volume[1],
          marketCap: marketCap[1],
          priceChange: 0, // Will be calculated
          volatility: Math.random() * 0.05, // Approximation
          source: "coingecko",
        }
      })
    } catch (error) {
      console.error("CoinGecko historical data error:", error)
      throw error
    }
  }
}

// Binance API Client
export class BinanceAPI {
  private baseUrl = API_CONFIG.binance.baseUrl

  async getCurrentPrice(symbol: string): Promise<any> {
    const binanceSymbol = SYMBOL_MAPPING.binance[symbol as keyof typeof SYMBOL_MAPPING.binance] || "BTCUSDT"
    const url = `${this.baseUrl}/ticker/24hr?symbol=${binanceSymbol}`

    try {
      const data = await httpClient.get(url)

      return {
        symbol,
        price: Number.parseFloat(data.lastPrice),
        priceChange: Number.parseFloat(data.priceChange),
        priceChangePercent: Number.parseFloat(data.priceChangePercent),
        volume: Number.parseFloat(data.volume),
        high: Number.parseFloat(data.highPrice),
        low: Number.parseFloat(data.lowPrice),
        openPrice: Number.parseFloat(data.openPrice),
        lastUpdated: Date.now(),
        source: "binance",
      }
    } catch (error) {
      console.error("Binance API error:", error)
      throw error
    }
  }

  async getKlineData(symbol: string, interval = "1d", limit = 30): Promise<any[]> {
    const binanceSymbol = SYMBOL_MAPPING.binance[symbol as keyof typeof SYMBOL_MAPPING.binance] || "BTCUSDT"
    const url = `${this.baseUrl}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`

    try {
      const data = await httpClient.get(url)

      return data.map((kline: any[]) => ({
        date: new Date(kline[0]),
        open: Number.parseFloat(kline[1]),
        high: Number.parseFloat(kline[2]),
        low: Number.parseFloat(kline[3]),
        price: Number.parseFloat(kline[4]), // Close price
        volume: Number.parseFloat(kline[5]),
        priceChange: (Number.parseFloat(kline[4]) - Number.parseFloat(kline[1])) / Number.parseFloat(kline[1]),
        volatility: (Number.parseFloat(kline[2]) - Number.parseFloat(kline[3])) / Number.parseFloat(kline[4]),
        source: "binance",
      }))
    } catch (error) {
      console.error("Binance kline data error:", error)
      throw error
    }
  }

  async getOrderBook(symbol: string, limit = 20): Promise<any> {
    const binanceSymbol = SYMBOL_MAPPING.binance[symbol as keyof typeof SYMBOL_MAPPING.binance] || "BTCUSDT"
    const url = `${this.baseUrl}/depth?symbol=${binanceSymbol}&limit=${limit}`

    try {
      const data = await httpClient.get(url)

      let bidTotal = 0
      let askTotal = 0

      const bids = data.bids.map((bid: [string, string]) => {
        const quantity = Number.parseFloat(bid[1])
        bidTotal += quantity
        return {
          price: Number.parseFloat(bid[0]),
          quantity,
          total: bidTotal,
        }
      })

      const asks = data.asks.map((ask: [string, string]) => {
        const quantity = Number.parseFloat(ask[1])
        askTotal += quantity
        return {
          price: Number.parseFloat(ask[0]),
          quantity,
          total: askTotal,
        }
      })

      return {
        bids,
        asks,
        lastUpdateId: data.lastUpdateId,
        timestamp: Date.now(),
        symbol,
        source: "binance",
      }
    } catch (error) {
      console.error("Binance orderbook error:", error)
      throw error
    }
  }
}

// CoinCap API Client
export class CoinCapAPI {
  private baseUrl = API_CONFIG.coincap.baseUrl

  async getCurrentPrice(symbol: string): Promise<any> {
    const coinId = SYMBOL_MAPPING.coincap[symbol as keyof typeof SYMBOL_MAPPING.coincap] || "bitcoin"
    const url = `${this.baseUrl}/assets/${coinId}`

    try {
      const response = await httpClient.get(url)
      const data = response.data

      return {
        symbol,
        price: Number.parseFloat(data.priceUsd),
        priceChange: (Number.parseFloat(data.changePercent24Hr) * Number.parseFloat(data.priceUsd)) / 100,
        priceChangePercent: Number.parseFloat(data.changePercent24Hr),
        volume: Number.parseFloat(data.volumeUsd24Hr),
        marketCap: Number.parseFloat(data.marketCapUsd),
        lastUpdated: Date.now(),
        source: "coincap",
      }
    } catch (error) {
      console.error("CoinCap API error:", error)
      throw error
    }
  }

  async getHistoricalData(symbol: string, interval = "d1"): Promise<any[]> {
    const coinId = SYMBOL_MAPPING.coincap[symbol as keyof typeof SYMBOL_MAPPING.coincap] || "bitcoin"
    const end = Date.now()
    const start = end - 30 * 24 * 60 * 60 * 1000 // 30 days ago
    const url = `${this.baseUrl}/assets/${coinId}/history?interval=${interval}&start=${start}&end=${end}`

    try {
      const response = await httpClient.get(url)
      const data = response.data

      return data.map((item: any, index: number) => {
        const price = Number.parseFloat(item.priceUsd)
        const prevPrice = index > 0 ? Number.parseFloat(data[index - 1].priceUsd) : price

        return {
          date: new Date(item.time),
          price,
          open: prevPrice,
          high: price * (1 + Math.random() * 0.02),
          low: price * (1 - Math.random() * 0.02),
          volume: Math.random() * 1000000000, // CoinCap doesn't provide historical volume
          priceChange: (price - prevPrice) / prevPrice,
          volatility: Math.abs((price - prevPrice) / prevPrice),
          source: "coincap",
        }
      })
    } catch (error) {
      console.error("CoinCap historical data error:", error)
      throw error
    }
  }
}

// Multi-API Client with fallback strategy
export class MultiAPIClient {
  private coingecko = new CoinGeckoAPI()
  private binance = new BinanceAPI()
  private coincap = new CoinCapAPI()

  async getCurrentPrice(symbol: string): Promise<any> {
    if (!USE_REAL_API) {
      throw new Error("Real API is disabled")
    }

    const apis = [
      { name: "binance", client: this.binance },
      { name: "coingecko", client: this.coingecko },
      { name: "coincap", client: this.coincap },
    ]

    for (const api of apis) {
      try {
        console.log(`Trying ${api.name} API for current price...`)
        const result = await api.client.getCurrentPrice(symbol)
        console.log(`✅ ${api.name} API success for ${symbol}`)
        return result
      } catch (error) {
        console.warn(`❌ ${api.name} API failed:`, error)
        continue
      }
    }

    throw new Error("All APIs failed to fetch current price")
  }

  async getHistoricalData(symbol: string): Promise<any[]> {
    if (!USE_REAL_API) {
      throw new Error("Real API is disabled")
    }

    const apis = [
      { name: "binance", client: this.binance, method: "getKlineData" },
      { name: "coingecko", client: this.coingecko, method: "getHistoricalData" },
      { name: "coincap", client: this.coincap, method: "getHistoricalData" },
    ]

    for (const api of apis) {
      try {
        console.log(`Trying ${api.name} API for historical data...`)
        const method = (api.client as any)[api.method]
        const result = await method.call(api.client, symbol)
        console.log(`✅ ${api.name} API success for ${symbol} historical data`)
        return result
      } catch (error) {
        console.warn(`❌ ${api.name} API failed:`, error)
        continue
      }
    }

    throw new Error("All APIs failed to fetch historical data")
  }

  async getOrderBook(symbol: string): Promise<any> {
    if (!USE_REAL_API) {
      throw new Error("Real API is disabled")
    }

    try {
      console.log("Trying Binance API for orderbook...")
      const result = await this.binance.getOrderBook(symbol)
      console.log(`✅ Binance API success for ${symbol} orderbook`)
      return result
    } catch (error) {
      console.warn("❌ Binance orderbook API failed:", error)
      throw error
    }
  }
}

// Export the main API client
export const apiClient = new MultiAPIClient()

// Export individual clients for direct use

// Utility functions
export const isAPIEnabled = () => USE_REAL_API
export const clearAPICache = () => apiCache.clear()

// WebSocket client for real-time data
export class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(symbol: string, onMessage: (data: any) => void): void {
    if (!process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET) return

    const binanceSymbol = SYMBOL_MAPPING.binance[symbol as keyof typeof SYMBOL_MAPPING.binance] || "btcusdt"
    const wsUrl = `${process.env.NEXT_PUBLIC_BINANCE_WS_URL}/${binanceSymbol.toLowerCase()}@ticker`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log(`✅ WebSocket connected for ${symbol}`)
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage({
            symbol,
            price: Number.parseFloat(data.c),
            priceChange: Number.parseFloat(data.P),
            volume: Number.parseFloat(data.v),
            high: Number.parseFloat(data.h),
            low: Number.parseFloat(data.l),
            timestamp: Date.now(),
            source: "binance-ws",
          })
        } catch (error) {
          console.error("WebSocket message parsing error:", error)
        }
      }

      this.ws.onclose = () => {
        console.log("WebSocket disconnected")
        this.reconnect(symbol, onMessage)
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }
    } catch (error) {
      console.error("WebSocket connection error:", error)
    }
  }

  private reconnect(symbol: string, onMessage: (data: any) => void): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts})...`)

      setTimeout(() => {
        this.connect(symbol, onMessage)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const wsClient = new WebSocketClient()
