"use client"

// Free API Configuration (No keys required)
const API_CONFIG = {
  coingecko: {
    baseUrl: process.env.NEXT_PUBLIC_COINGECKO_API_URL || "https://api.coingecko.com/api/v3",
    key: process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "",
    corsEnabled: true,
  },
  coincap: {
    baseUrl: process.env.NEXT_PUBLIC_COINCAP_API_URL || "https://api.coincap.io/v2",
    key: process.env.NEXT_PUBLIC_COINCAP_API_KEY || "",
    corsEnabled: true,
  },
  cryptocompare: {
    baseUrl: process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_URL || "https://min-api.cryptocompare.com/data",
    key: process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY || "",
    corsEnabled: true,
  },
}

const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === "true"
const API_TIMEOUT = Number.parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000")
const ENABLE_CACHING = process.env.NEXT_PUBLIC_ENABLE_CACHING === "true"
const CACHE_DURATION = Number.parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION || "300000")

// Enhanced Cache implementation
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; source: string }>()

  set(key: string, data: any, source = "unknown"): void {
    this.cache.set(key, { data, timestamp: Date.now(), source })
    console.log(`💾 Cached data for ${key} from ${source}`)
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key)
      console.log(`🗑️ Cache expired for ${key}`)
      return null
    }

    console.log(`✅ Cache hit for ${key} (${cached.source})`)
    return { ...cached.data, fromCache: true, cacheSource: cached.source }
  }

  clear(): void {
    this.cache.clear()
    console.log("🧹 Cache cleared")
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

const apiCache = new APICache()

// Rate limiting for free APIs
class RateLimiter {
  private requests = new Map<string, number[]>()
  private limit = Number.parseInt(process.env.NEXT_PUBLIC_API_RATE_LIMIT || "30")
  private window = Number.parseInt(process.env.NEXT_PUBLIC_API_RATE_WINDOW || "60000")

  canMakeRequest(endpoint: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(endpoint) || []

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.window)

    if (validRequests.length >= this.limit) {
      console.warn(`⚠️ Rate limit exceeded for ${endpoint}`)
      return false
    }

    validRequests.push(now)
    this.requests.set(endpoint, validRequests)
    return true
  }

  getStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    for (const [endpoint, requests] of this.requests.entries()) {
      const now = Date.now()
      const validRequests = requests.filter((time) => now - time < this.window)
      stats[endpoint] = validRequests.length
    }
    return stats
  }
}

const rateLimiter = new RateLimiter()

// Enhanced HTTP Client with better error handling
class HTTPClient {
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

    try {
      console.log(`🌐 Fetching: ${url}`)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
        mode: "cors", // Explicitly set CORS mode
      })

      clearTimeout(timeoutId)
      console.log(`📡 Response: ${response.status} ${response.statusText}`)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      console.error(`❌ Fetch error for ${url}:`, error)
      throw error
    }
  }

  async get(url: string, options: RequestInit = {}): Promise<any> {
    // Check cache first
    if (ENABLE_CACHING) {
      const cached = apiCache.get(url)
      if (cached) {
        return cached
      }
    }

    // Check rate limiting
    if (!rateLimiter.canMakeRequest(url)) {
      throw new Error("Rate limit exceeded. Please wait before making more requests.")
    }

    try {
      const response = await this.fetchWithTimeout(url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache successful responses
      if (ENABLE_CACHING) {
        const source = new URL(url).hostname
        apiCache.set(url, data, source)
      }

      return data
    } catch (error) {
      console.error(`💥 API request failed for ${url}:`, error)
      throw error
    }
  }
}

const httpClient = new HTTPClient()

// Symbol mapping for different APIs
const SYMBOL_MAPPING = {
  coingecko: {
    BTCUSDT: "bitcoin",
    ETHUSDT: "ethereum",
    ADAUSDT: "cardano",
    SOLUSDT: "solana",
    DOTUSDT: "polkadot",
  },
  coincap: {
    BTCUSDT: "bitcoin",
    ETHUSDT: "ethereum",
    ADAUSDT: "cardano",
    SOLUSDT: "solana",
    DOTUSDT: "polkadot",
  },
  cryptocompare: {
    BTCUSDT: "BTC",
    ETHUSDT: "ETH",
    ADAUSDT: "ADA",
    SOLUSDT: "SOL",
    DOTUSDT: "DOT",
  },
}

// CoinGecko API Client (FREE - No key required)
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
        priceChange: ((coinData.usd_24h_change || 0) * coinData.usd) / 100,
        priceChangePercent: coinData.usd_24h_change || 0,
        volume: coinData.usd_24h_vol || 0,
        high: coinData.usd * (1 + Math.abs(coinData.usd_24h_change || 0) / 100),
        low: coinData.usd * (1 - Math.abs(coinData.usd_24h_change || 0) / 100),
        lastUpdated: coinData.last_updated_at ? coinData.last_updated_at * 1000 : Date.now(),
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

      if (!data.prices || data.prices.length === 0) {
        throw new Error("No historical data available")
      }

      return data.prices.map((price: [number, number], index: number) => {
        const volume = data.total_volumes[index] || [0, 0]
        const prevPrice = index > 0 ? data.prices[index - 1][1] : price[1]
        const priceChange = (price[1] - prevPrice) / prevPrice

        return {
          date: new Date(price[0]),
          price: price[1],
          open: prevPrice,
          high: price[1] * (1 + Math.abs(priceChange) * 0.5),
          low: price[1] * (1 - Math.abs(priceChange) * 0.5),
          volume: volume[1],
          priceChange: priceChange,
          volatility: Math.abs(priceChange),
          source: "coingecko",
        }
      })
    } catch (error) {
      console.error("CoinGecko historical data error:", error)
      throw error
    }
  }

  async getOrderBook(symbol: string): Promise<any> {
    // CoinGecko doesn't provide orderbook data in free tier
    // Generate realistic orderbook based on current price
    try {
      const priceData = await this.getCurrentPrice(symbol)
      const currentPrice = priceData.price
      const spread = currentPrice * 0.001

      const bids: any[] = []
      const asks: any[] = []
      let bidTotal = 0
      let askTotal = 0

      // Generate realistic bids and asks
      for (let i = 0; i < 20; i++) {
        const bidPrice = currentPrice - spread / 2 - spread * i * 0.1
        const askPrice = currentPrice + spread / 2 + spread * i * 0.1
        const quantity = 5 + Math.random() * 10

        bidTotal += quantity
        askTotal += quantity

        bids.push({
          price: Math.max(bidPrice, 0.01),
          quantity,
          total: bidTotal,
        })

        asks.push({
          price: askPrice,
          quantity,
          total: askTotal,
        })
      }

      return {
        bids,
        asks,
        lastUpdateId: Date.now(),
        timestamp: Date.now(),
        symbol,
        source: "coingecko-simulated",
      }
    } catch (error) {
      console.error("CoinGecko orderbook simulation error:", error)
      throw error
    }
  }
}

// CoinCap API Client (FREE - No key required)
export class CoinCapAPI {
  private baseUrl = API_CONFIG.coincap.baseUrl

  async getCurrentPrice(symbol: string): Promise<any> {
    const coinId = SYMBOL_MAPPING.coincap[symbol as keyof typeof SYMBOL_MAPPING.coincap] || "bitcoin"
    const url = `${this.baseUrl}/assets/${coinId}`

    try {
      const response = await httpClient.get(url)
      const data = response.data

      if (!data) {
        throw new Error(`No data found for ${coinId}`)
      }

      return {
        symbol,
        price: Number.parseFloat(data.priceUsd),
        priceChange: (Number.parseFloat(data.changePercent24Hr) * Number.parseFloat(data.priceUsd)) / 100,
        priceChangePercent: Number.parseFloat(data.changePercent24Hr),
        volume: Number.parseFloat(data.volumeUsd24Hr) || 0,
        high: Number.parseFloat(data.priceUsd) * (1 + Math.abs(Number.parseFloat(data.changePercent24Hr)) / 100),
        low: Number.parseFloat(data.priceUsd) * (1 - Math.abs(Number.parseFloat(data.changePercent24Hr)) / 100),
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

      if (!data || data.length === 0) {
        throw new Error("No historical data available")
      }

      return data.map((item: any, index: number) => {
        const price = Number.parseFloat(item.priceUsd)
        const prevPrice = index > 0 ? Number.parseFloat(data[index - 1].priceUsd) : price
        const priceChange = (price - prevPrice) / prevPrice

        return {
          date: new Date(item.time),
          price,
          open: prevPrice,
          high: price * (1 + Math.abs(priceChange) * 0.5),
          low: price * (1 - Math.abs(priceChange) * 0.5),
          volume: Math.random() * 1000000000, // CoinCap doesn't provide historical volume
          priceChange: priceChange,
          volatility: Math.abs(priceChange),
          source: "coincap",
        }
      })
    } catch (error) {
      console.error("CoinCap historical data error:", error)
      throw error
    }
  }
}

// CryptoCompare API Client (FREE tier - No key required for basic usage)
export class CryptoCompareAPI {
  private baseUrl = API_CONFIG.cryptocompare.baseUrl
  private apiKey = API_CONFIG.cryptocompare.key

  private getHeaders() {
    const headers: Record<string, string> = {}
    if (this.apiKey) {
      headers.authorization = `Apikey ${this.apiKey}`
    }
    return headers
  }

  async getCurrentPrice(symbol: string): Promise<any> {
    const cryptoSymbol = SYMBOL_MAPPING.cryptocompare[symbol as keyof typeof SYMBOL_MAPPING.cryptocompare] || "BTC"
    const url = `${this.baseUrl}/pricemultifull?fsyms=${cryptoSymbol}&tsyms=USD`

    try {
      const data = await httpClient.get(url, { headers: this.getHeaders() })
      const coinData = data.RAW?.[cryptoSymbol]?.USD

      if (!coinData) {
        throw new Error(`No data found for ${cryptoSymbol}`)
      }

      return {
        symbol,
        price: coinData.PRICE,
        priceChange: coinData.CHANGE24HOUR,
        priceChangePercent: coinData.CHANGEPCT24HOUR,
        volume: coinData.VOLUME24HOURTO,
        high: coinData.HIGH24HOUR,
        low: coinData.LOW24HOUR,
        openPrice: coinData.OPEN24HOUR,
        lastUpdated: coinData.LASTUPDATE * 1000,
        source: "cryptocompare",
      }
    } catch (error) {
      console.error("CryptoCompare API error:", error)
      throw error
    }
  }

  async getHistoricalData(symbol: string, limit = 30): Promise<any[]> {
    const cryptoSymbol = SYMBOL_MAPPING.cryptocompare[symbol as keyof typeof SYMBOL_MAPPING.cryptocompare] || "BTC"
    const url = `${this.baseUrl}/v2/histoday?fsym=${cryptoSymbol}&tsym=USD&limit=${limit}`

    try {
      const response = await httpClient.get(url, { headers: this.getHeaders() })
      const data = response.Data?.Data

      if (!data || data.length === 0) {
        throw new Error("No historical data available")
      }

      return data.map((item: any) => {
        const priceChange = (item.close - item.open) / item.open

        return {
          date: new Date(item.time * 1000),
          price: item.close,
          open: item.open,
          high: item.high,
          low: item.low,
          volume: item.volumeto,
          priceChange: priceChange,
          volatility: Math.abs(priceChange),
          source: "cryptocompare",
        }
      })
    } catch (error) {
      console.error("CryptoCompare historical data error:", error)
      throw error
    }
  }
}

// Multi-API Client with smart fallback (FREE APIs only)
export class FreeMultiAPIClient {
  private coingecko = new CoinGeckoAPI()
  private coincap = new CoinCapAPI()
  private cryptocompare = new CryptoCompareAPI()

  async getCurrentPrice(symbol: string): Promise<any> {
    if (!USE_REAL_API) {
      throw new Error("Real API is disabled")
    }

    const apis = [
      { name: "coingecko", client: this.coingecko },
      { name: "coincap", client: this.coincap },
      { name: "cryptocompare", client: this.cryptocompare },
    ]

    for (const api of apis) {
      try {
        console.log(`🚀 Trying ${api.name} API for current price...`)
        const result = await api.client.getCurrentPrice(symbol)
        console.log(`✅ ${api.name} API success for ${symbol}`)
        return result
      } catch (error) {
        console.warn(`❌ ${api.name} API failed:`, error)
        continue
      }
    }

    throw new Error("All free APIs failed to fetch current price")
  }

  async getHistoricalData(symbol: string): Promise<any[]> {
    if (!USE_REAL_API) {
      throw new Error("Real API is disabled")
    }

    const apis = [
      { name: "coingecko", client: this.coingecko, method: "getHistoricalData" },
      { name: "cryptocompare", client: this.cryptocompare, method: "getHistoricalData" },
      { name: "coincap", client: this.coincap, method: "getHistoricalData" },
    ]

    for (const api of apis) {
      try {
        console.log(`🚀 Trying ${api.name} API for historical data...`)
        const method = (api.client as any)[api.method]
        const result = await method.call(api.client, symbol)
        console.log(`✅ ${api.name} API success for ${symbol} historical data`)
        return result
      } catch (error) {
        console.warn(`❌ ${api.name} API failed:`, error)
        continue
      }
    }

    throw new Error("All free APIs failed to fetch historical data")
  }

  async getOrderBook(symbol: string): Promise<any> {
    if (!USE_REAL_API) {
      throw new Error("Real API is disabled")
    }

    try {
      console.log("🚀 Trying CoinGecko API for simulated orderbook...")
      const result = await this.coingecko.getOrderBook(symbol)
      console.log(`✅ CoinGecko simulated orderbook success for ${symbol}`)
      return result
    } catch (error) {
      console.warn("❌ CoinGecko orderbook simulation failed:", error)
      throw error
    }
  }

  // Utility methods
  getCacheStats() {
    return apiCache.getStats()
  }

  getRateLimitStats() {
    return rateLimiter.getStats()
  }

  clearCache() {
    apiCache.clear()
  }
}

// Export the main API client
export const freeApiClient = new FreeMultiAPIClient()

// Export individual clients for direct use

// Utility functions
export const isAPIEnabled = () => USE_REAL_API
export const clearAPICache = () => freeApiClient.clearCache()
export const getAPIStats = () => ({
  cache: freeApiClient.getCacheStats(),
  rateLimit: freeApiClient.getRateLimitStats(),
})

// Simple WebSocket simulation (since free APIs don't provide WebSocket)
export class WebSocketSimulator {
  private interval: NodeJS.Timeout | null = null
  private isRunning = false

  start(symbol: string, onMessage: (data: any) => void): void {
    if (this.isRunning) return

    console.log(`🔌 Starting WebSocket simulation for ${symbol}...`)
    this.isRunning = true

    // Simulate real-time updates every 5-10 seconds
    this.interval = setInterval(
      async () => {
        try {
          const currentPrice = await freeApiClient.getCurrentPrice(symbol)

          // Add small random variation to simulate real-time changes
          const variation = (Math.random() - 0.5) * 0.002 // ±0.2%
          const simulatedPrice = currentPrice.price * (1 + variation)

          onMessage({
            symbol,
            price: simulatedPrice,
            priceChange: currentPrice.priceChange + currentPrice.price * variation,
            priceChangePercent: currentPrice.priceChangePercent + variation * 100,
            volume: currentPrice.volume,
            high: Math.max(currentPrice.high, simulatedPrice),
            low: Math.min(currentPrice.low, simulatedPrice),
            timestamp: Date.now(),
            source: "websocket-simulation",
          })
        } catch (error) {
          console.warn("WebSocket simulation error:", error)
        }
      },
      5000 + Math.random() * 5000,
    )
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isRunning = false
    console.log("🔌 WebSocket simulation stopped")
  }
}

export const wsSimulator = new WebSocketSimulator()
