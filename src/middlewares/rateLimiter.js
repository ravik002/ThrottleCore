const { buildRedisKey } = require('../core/keyBuilder')
const { isDuplicate } = require('../core/dedeuplicationChecker');
const { consumeTokens, refillTokens } = require('../core/tokenBucketManager');
const { ThrottleCoreException } = require('../utils/exceptions');
const { RATE_LIMIT_EXCEEDED_CODE, RATE_LIMIT_EXCEEDED_MESSAGE, DUPLICATE_REQUEST_CODE, DUPLICATE_REQUEST_MESSAGE } = require('../utils/constants')



/**
 * Creates a rate-limiting middleware for a given policy.
 * 
 * This middleware uses the token bucket algorithm to control the number of
 * requests allowed within a specified time window. If the request is allowed,
 * it continues to the next middleware. Otherwise, it throws a rate-limit
 * exceeded error.
 * 
 * @param {Object} policy Rate Limiter Policy
 * @param {Object} config Rate Limiter Configurations
 * 
 * @returns {Promise<Function>} Rate Limiter middleware function
 */
const createLimiterMiddleware = function (policy, config) {
    return async function (req, res, next) {
        try {
            const identityKey = buildRedisKey(policy, req);

            await refillTokens(identityKey, policy);

            const { allowed, remaining, resetMs } = await consumeTokens(
                identityKey,
                policy.limit,
                policy.windowMs
            );

            if (config.addRateLimitHeaders) {
                res.setHeader("X-RateLimit-Limit", policy.limit);
                res.setHeader("X-RateLimit-Remaining", Math.max(remaining, 0));
                res.setHeader("X-RateLimit-Reset", resetMs);
            }

            if (!allowed) {
                res.status(429);
                throw ThrottleCoreException(RATE_LIMIT_EXCEEDED_CODE, RATE_LIMIT_EXCEEDED_MESSAGE, []);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Creates a deduplication middleware for a given policy.
 *
 * This middleware prevents duplicate requests within a specified window
 * of time. Useful for avoiding duplicate form submissions or idempotency
 * issues. If a duplicate is detected, it throws a duplicate request error.
 * 
 * @param {Object} policy Deduplication Policy
 * 
 * @returns {Promise<Function>} Deduplication middleware function
 */
const createDedupMiddleware = function (policy) {
    return async function (req, res, next) {
        try {
            const identityKey = buildRedisKey(policy, req);
            const isRequestDuplicate = await isDuplicate(identityKey, policy.windowMs);

            if (isRequestDuplicate) {
                res.status(429);
                throw ThrottleCoreException(DUPLICATE_REQUEST_CODE, DUPLICATE_REQUEST_MESSAGE, []);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Initializes ThrottleCore with the given configuration and builds the
 * appropriate middleware functions for rate limiting and deduplication.
 *
 * - Returns categorized middlewares (`limiter[]`, `deduplication[]`) so the
 *   caller can apply them selectively per route.
 *
 * @param {Object} config - ThrottleCore configuration object.
 *
 * @returns {Object} An object containing categorized middlewares:
 *   - `{Function[]} limiter` → Array of rate-limiting middlewares.
 *   - `{Function[]} deduplication` → Array of deduplication middlewares.
 */
module.exports.init = function (config) {
    const middlewares = {
        limiter: [],
        deduplication: []
    };

    for (const policy of config.policies) {
        if (policy.category === "limiter") {
            middlewares.limiter.push(createLimiterMiddleware(policy, config));
        }

        if (policy.category === "deduplication") {
            middlewares.deduplication.push(createDedupMiddleware(policy));
        }
    }

    return middlewares;
};