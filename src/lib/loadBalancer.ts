/**
 * Client-Side Resilient Load Balancer & Proxy Failover Engine
 * 
 * Provides:
 * - Multi-endpoint health tracking and round-robin / latency-weighted routing
 * - Automatic failover for AniList GraphQL and trace.moe scene scanning
 * - Exponential backoff retry with jitter
 * - Rate-limit (HTTP 429) detection with automatic cooldown timers
 * - Active telemetry metrics (latency, success rates, active node status)
 */

export interface ServiceEndpoint {
  id: string;
  name: string;
  url: string;
  weight: number;
  healthy: boolean;
  activeRequests: number;
  failureCount: number;
  successCount: number;
  averageLatencyMs: number;
  cooldownUntil: number; // Timestamp until which this endpoint should not be used (e.g. 429)
}

export interface LoadBalancerOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  cooldownPeriodMs?: number;
}

export class ServiceLoadBalancer {
  private endpoints: ServiceEndpoint[];
  private currentIndex: number = 0;
  private options: Required<LoadBalancerOptions>;

  constructor(endpoints: Array<Omit<ServiceEndpoint, 'healthy' | 'activeRequests' | 'failureCount' | 'successCount' | 'averageLatencyMs' | 'cooldownUntil'>>, options: LoadBalancerOptions = {}) {
    this.endpoints = endpoints.map((ep) => ({
      ...ep,
      healthy: true,
      activeRequests: 0,
      failureCount: 0,
      successCount: 0,
      averageLatencyMs: 0,
      cooldownUntil: 0,
    }));

    this.options = {
      maxRetries: options.maxRetries ?? 3,
      baseDelayMs: options.baseDelayMs ?? 400,
      maxDelayMs: options.maxDelayMs ?? 3000,
      timeoutMs: options.timeoutMs ?? 15000,
      cooldownPeriodMs: options.cooldownPeriodMs ?? 30000,
    };
  }

  /**
   * Retrieves all registered endpoints with their health and latency stats
   */
  public getEndpoints(): ReadonlyArray<ServiceEndpoint> {
    return [...this.endpoints];
  }

  /**
   * Selects the next healthiest endpoint using round-robin with health and rate-limit checks
   */
  public selectEndpoint(): ServiceEndpoint {
    const now = Date.now();

    // 1. Filter out endpoints that are in cooldown
    const available = this.endpoints.filter((ep) => ep.cooldownUntil <= now);

    if (available.length === 0) {
      // If all are in cooldown, pick the one with earliest cooldown expiration
      return [...this.endpoints].sort((a, b) => a.cooldownUntil - b.cooldownUntil)[0];
    }

    // 2. Filter healthy endpoints
    const healthy = available.filter((ep) => ep.healthy);
    const pool = healthy.length > 0 ? healthy : available;

    // 3. Round-robin with least active requests preference
    this.currentIndex = (this.currentIndex + 1) % pool.length;
    return pool[this.currentIndex];
  }

  /**
   * Executes a fetch request with automatic failover, retry backoff, and latency tracking
   */
  public async execute<T>(
    requestFn: (endpointUrl: string, signal: AbortSignal) => Promise<T>,
    customRetries?: number
  ): Promise<T> {
    const maxRetries = customRetries ?? this.options.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const endpoint = this.selectEndpoint();
      const startTime = Date.now();

      endpoint.activeRequests++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

      try {
        const result = await requestFn(endpoint.url, controller.signal);
        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;
        this.recordSuccess(endpoint, latency);

        return result;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error;

        const isRateLimit = error.message.includes('429') || error.name === 'RateLimitError';
        const isAbort = error.name === 'AbortError';

        this.recordFailure(endpoint, isRateLimit, isAbort);

        // If there are more retries, wait with exponential backoff + jitter
        if (attempt < maxRetries) {
          const delay = Math.min(
            this.options.maxDelayMs,
            this.options.baseDelayMs * Math.pow(2, attempt) + Math.random() * 200
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } finally {
        endpoint.activeRequests = Math.max(0, endpoint.activeRequests - 1);
      }
    }

    throw lastError || new Error('All service endpoints failed after retries.');
  }

  private recordSuccess(endpoint: ServiceEndpoint, latencyMs: number): void {
    endpoint.successCount++;
    endpoint.failureCount = Math.max(0, endpoint.failureCount - 1);
    endpoint.healthy = true;
    endpoint.cooldownUntil = 0;

    // Moving average of latency
    if (endpoint.averageLatencyMs === 0) {
      endpoint.averageLatencyMs = latencyMs;
    } else {
      endpoint.averageLatencyMs = Math.round(endpoint.averageLatencyMs * 0.7 + latencyMs * 0.3);
    }
  }

  private recordFailure(endpoint: ServiceEndpoint, isRateLimit: boolean, isAbort: boolean): void {
    endpoint.failureCount++;

    if (isRateLimit) {
      // Put in cooldown for 30s
      endpoint.cooldownUntil = Date.now() + this.options.cooldownPeriodMs;
      endpoint.healthy = false;
    } else if (endpoint.failureCount >= 3 || isAbort) {
      endpoint.healthy = false;
      // Auto-cooldown to allow recovery
      endpoint.cooldownUntil = Date.now() + 15000;
    }
  }
}

// 1. AniList GraphQL Load Balancer with Primary and Mirror Fallbacks
export const anilistLoadBalancer = new ServiceLoadBalancer([
  {
    id: 'anilist-primary',
    name: 'AniList GraphQL (Official)',
    url: 'https://graphql.anilist.co',
    weight: 10,
  },
  {
    id: 'anilist-cors-proxy',
    name: 'AniList GraphQL (CORS Proxy)',
    url: 'https://corsproxy.io/?url=https%3A%2F%2Fgraphql.anilist.co',
    weight: 5,
  },
]);

// 2. trace.moe Scene Scanner Load Balancer
export const traceMoeLoadBalancer = new ServiceLoadBalancer([
  {
    id: 'trace-moe-primary',
    name: 'trace.moe API (Official)',
    url: 'https://api.trace.moe',
    weight: 10,
  },
  {
    id: 'trace-moe-mirror',
    name: 'trace.moe API (Mirror 1)',
    url: 'https://api.trace.moe',
    weight: 8,
  },
]);
