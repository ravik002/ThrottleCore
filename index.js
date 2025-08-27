const { init } = require('./src/middlewares/rateLimiter')
const { initRedisClient } = require('./src/datastore/redisClient')
const { ThrottleCoreException } = require('./src/utils/exceptions')
const { CONFIG_VALIDATION_CODE, CONFIG_VALIDATION_MESSAGE } = require('./src/utils/constants')
const { validateRateLimiterConfiguration } = require('./src/validators/rateLimiterConfigValidator')



/**
 * initRateLimiter
 * 
 * Initializes & provides a new Rate Limiter Middleware 
 * 
 * @param {Object} config Rate Limiter Configurations
 * 
 * @returns {Object} An object containing categorized middlewares:
 *   - `{Function[]} limiter` → Array of rate-limiting middlewares.
 *   - `{Function[]} deduplication` → Array of deduplication middlewares.
 */
module.exports.initRateLimiter = async function (config) {
    try {
        if (!config) {
            throw ThrottleCoreException(CONFIG_VALIDATION_CODE, CONFIG_VALIDATION_MESSAGE, [])
        }

        await validateRateLimiterConfiguration(config)

        await initRedisClient(config.redisConfig)

        return init(config);

    } catch (error) {
        console.error(`Error occurred while initializing Rate Limiter :: ${JSON.stringify(error)}`)

        throw error;
    }
}