import { RequestHandler } from "express";

/**
 * ThrottleCore - Token Bucket Rate Limiter
 */
export interface RedisConfig {
  url?: string;
}

export interface RateLimitPolicy {
  category: string;
  limit: number;
  windowMs: number;
  identityKeyHeader: string;
}

export interface RateLimiterConfig {
  redisConfig?: RedisConfig;
  addRateLimitHeaders?: boolean;
  policies: RateLimitPolicy[];
}

/**
 * configureRateLimiter
 *
 * Initializes ThrottleCore with the given configuration and builds the
 * appropriate middleware functions for rate limiting and deduplication.
 *
 * - Returns categorized middlewares (`limiter[]`, `deduplication[]`) so the
 *   caller can apply them selectively per route.
 * 
 * @param config - Rate Limiter configurations
 * 
 * @returns Object containing categorized middlewares
 */
export function configureRateLimiter(
  config: RateLimiterConfig
): Promise<{
  limiter: RequestHandler[];
  deduplication: RequestHandler[];
}>;

