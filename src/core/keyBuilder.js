const crypto = require('crypto');

/**
 * buildRedisKey
 * 
 * Builds a unique Redis key for rate-limiting or deduplication policies
 * 
 * @param {Object} policy The Policy object
 * @param {Object} req The Request Object
 * 
 * @returns {String} redisKey
 */
module.exports.buildRedisKey = function (policy, req) {
    let identityValue = null;
    const category = policy.category;

    if (policy.identityKeyHeader) {
        identityValue = req.headers[policy.identityKeyHeader.toLowerCase()] || null
    }

    if (!identityValue) {
        identityValue = req.ip || 'unknown-ip';
    }

    let redisKey = `${category}:${identityValue}`

    if (category === 'limiter') {
        redisKey += `:${policy.windowMs}`
    }

    if (category === 'deduplication') {
        let payloadHash = '';
        if (req.body) {
            payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex').substring(0, 12);
        }
        redisKey += `:${payloadHash}`
    }

    return redisKey;
}