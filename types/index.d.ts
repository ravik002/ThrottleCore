import { RequestHandler } from "express";

/**
 * ThrottleCore - Token Bucket Rate Limiter
 */
export interface RedisConfig {
  /**
   * Redis connection string (e.g. `redis://localhost:6379`).
   */
  url?: string;
}

export interface RateLimitPolicy {
  /**
   * Logical category for the policy (Enum: 'limiter' | 'deduplication')
  */
  category: "limiter" | "deduplication";

  /**
   * Maximum number of requests allowed within the time window.
  */
  limit: number;

  /**
   * Time window for the rate limit, in milliseconds.
   * 
   * Example: `60000` = 1 minute.
  */
  windowMs: number;

  /**
   * Name of the HTTP header used to uniquely identify a client.
   * 
   * Example: `"x-api-key"` or `"authorization"`.
   * 
   * Used to apply rate limiting per client identity rather than just by IP.
  */
  identityKeyHeader: string;
}

export interface RateLimiterConfig {
  /**
   * Redis connection settings.
   *
   * @see {@link RedisConfig}
   */
  redisConfig?: RedisConfig;

  /**
   * Whether to automatically add standard
   * rate limit headers (e.g., `X-RateLimit-Remaining`) in responses.
   *
   * Defaults to `false`.
   */
  addRateLimitHeaders?: boolean;

  /**
   * List of rate limit policies that define
   * how requests should be throttled.
   *
   * @see {@link RateLimitPolicy}
   */
  policies: RateLimitPolicy[];
}

/**
 * initRateLimiter
 *
 * Initializes ThrottleCore with the given configuration and builds the
 * appropriate middleware functions for rate limiting and deduplication.
 * 
 * @param config - Rate Limiter configurations
 * 
 * @returns Object containing categorized Express middlewares (`limiter[]`, `deduplication[]`)
 * - `limiter`: Middleware array for request throttling.
 * - `deduplication`: Middleware array for duplicate request detection.
 */
export function initRateLimiter(
  config: RateLimiterConfig
): Promise<{
  limiter: RequestHandler[];
  deduplication: RequestHandler[];
}>;

