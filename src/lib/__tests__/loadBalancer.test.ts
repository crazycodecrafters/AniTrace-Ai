import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceLoadBalancer } from '../loadBalancer';

describe('ServiceLoadBalancer Engine', () => {
  let loadBalancer: ServiceLoadBalancer;

  beforeEach(() => {
    loadBalancer = new ServiceLoadBalancer(
      [
        { id: 'ep-1', name: 'Primary Node', url: 'https://api1.example.com', weight: 10 },
        { id: 'ep-2', name: 'Backup Node', url: 'https://api2.example.com', weight: 5 },
      ],
      { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 50, timeoutMs: 1000, cooldownPeriodMs: 1000 }
    );
  });

  it('initializes endpoints as healthy with zero latency stats', () => {
    const endpoints = loadBalancer.getEndpoints();
    expect(endpoints).toHaveLength(2);
    expect(endpoints[0].healthy).toBe(true);
    expect(endpoints[0].failureCount).toBe(0);
    expect(endpoints[0].successCount).toBe(0);
  });

  it('successfully routes request through healthy endpoint', async () => {
    const mockRequest = vi.fn().mockResolvedValue({ data: 'success' });
    const result = await loadBalancer.execute(mockRequest);

    expect(result).toEqual({ data: 'success' });
    expect(mockRequest).toHaveBeenCalledTimes(1);

    const endpoints = loadBalancer.getEndpoints();
    const successfulEndpoint = endpoints.find((e) => e.successCount > 0);
    expect(successfulEndpoint).toBeDefined();
    expect(successfulEndpoint?.healthy).toBe(true);
  });

  it('automatically fails over to secondary endpoint when primary fails', async () => {
    const mockRequest = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error on primary'))
      .mockResolvedValueOnce({ data: 'backup success' });

    const result = await loadBalancer.execute(mockRequest);

    expect(result).toEqual({ data: 'backup success' });
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it('places endpoint in cooldown when encountering rate limit (HTTP 429)', async () => {
    const rateLimitError = new Error('HTTP 429: Rate limit reached');
    const mockRequest = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({ data: 'recovered' });

    const result = await loadBalancer.execute(mockRequest);
    expect(result).toEqual({ data: 'recovered' });

    const endpoints = loadBalancer.getEndpoints();
    const rateLimitedNode = endpoints.find((e) => e.cooldownUntil > Date.now());
    expect(rateLimitedNode).toBeDefined();
    expect(rateLimitedNode?.healthy).toBe(false);
  });

  it('throws error when all retries across all endpoints are exhausted', async () => {
    const mockRequest = vi.fn().mockRejectedValue(new Error('Complete outage'));

    await expect(loadBalancer.execute(mockRequest, 1)).rejects.toThrow('Complete outage');
  });
});
