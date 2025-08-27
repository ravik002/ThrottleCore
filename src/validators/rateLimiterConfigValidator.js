const Joi = require('joi');
const { ThrottleCoreException } = require('../utils/exceptions')
const { CONFIG_VALIDATION_CODE, CONFIG_VALIDATION_MESSAGE } = require('../utils/constants')

/**
 * validateRateLimiterConfiguration
 * 
 * Validates the configuration object passed in during the Rate Limiter Initialization flow
 * 
 * @param {Object} configuration Rate Limiter Config
 * 
 * @returns {void} 
 */
module.exports.validateRateLimiterConfiguration = async function (configuration) {

    const configSchema = Joi.object({

        redisConfig: Joi.object({
            url: Joi.string().uri().required()
        }).required(),

        addRateLimitHeaders: Joi.boolean().default(true),

        policies: Joi.array().items(
            Joi.object({
                category: Joi.string().trim().valid('limiter', 'deduplication').required(),
                windowMs: Joi.number().positive().required(),
                limit: Joi.when('category', {
                    is: 'limiter',
                    then: Joi.number().positive().required(),
                    otherwise: Joi.forbidden()
                }),
                identityKeyHeader: Joi.string().trim()
            })
        ).min(1).required()

    })

    try {
        await configSchema.validateAsync(configuration, { abortEarly: false });
    } catch (error) {

        let detailedError = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }))

        throw ThrottleCoreException(CONFIG_VALIDATION_CODE, CONFIG_VALIDATION_MESSAGE, detailedError)
    }
}