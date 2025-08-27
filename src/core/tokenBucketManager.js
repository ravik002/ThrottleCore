const { executeCommand } = require('../datastore/redisClient')


/**
 * consumeTokens
 * 
 * Checks and consumes a token from the Rate Limit Bucket for the given key
 * 
 * @param {String} key Redis Key
 * @param {Number} limit Max Bucket Limit
 * @param {Number} windowMs Window size in Milliseconds
 * 
 * @returns {Promise<Object>} 
 */
module.exports.consumeTokens = async function (key, limit, windowMs) {
    const windowSeconds = Math.ceil(windowMs / 1000)

    const ttl = await executeCommand('ttl', key);

    if (ttl === -2) {
        await executeCommand('set', key, limit - 1, 'EX', windowSeconds);

        return {
            allowed: true,
            remaining: limit - 1,
            resetMs: windowMs
        }
    }

    let tokensLeft = await executeCommand('get', key)
    tokensLeft = +tokensLeft;

    if (tokensLeft > 0) {
        await executeCommand('decr', key)

        return {
            allowed: true,
            remaining: tokensLeft - 1,
            resetMs: ttl * 1000
        }
    }

    return {
        allowed: false,
        remaining: 0,
        resetMs: ttl * 1000
    }
}

/**
 * refillTokens
 * 
 * Computes & Refills new Tokens in the Bucket for the provided tokensKey
 * 
 * @param {String} tokensKey Redis Key For Limiter
 * @param {Object} policy Policy Object
 * 
 * @returns {Promise<void>}
 */
module.exports.refillTokens = async function (tokensKey, policy) {
    const lastRefillKey = `${tokensKey}:lastRefill`;

    const [tokensStr, lastRefillStr] = await executeCommand('mget', tokensKey, lastRefillKey);

    let now = Date.now();
    let tokens, lastRefillTime;

    if (!tokensStr && !lastRefillStr) {
        tokens = policy.limit;
        lastRefillTime = now;

        await executeCommand('set', tokensKey, tokens, 'EX', Math.ceil(policy.windowMs / 1000));
        await executeCommand('set', lastRefillKey, lastRefillTime, 'EX', Math.ceil(policy.windowMs / 1000));

        return;
    }

    tokens = +tokensStr;
    lastRefillTime = +lastRefillStr;
    // console.log('tokenKey: ', tokensKey, 'tokens count current: ', tokens, 'last Refill time', lastRefillTime)
    let elapsedTime = now - lastRefillTime
    // console.log('now ->', now, 'lastRefillTime ->', lastRefillTime, 'elapsed time calculation -> ', elapsedTime)
    const tokensRefillingRateMs = (policy.limit / policy.windowMs);
    const tokensToAdd = Math.floor(elapsedTime * tokensRefillingRateMs);
    // console.log('tokensRefillingRateMs: ', tokensRefillingRateMs, 'tokensToAdd: ', tokensToAdd)
    if (tokensToAdd > 0) {
        tokens = Math.min(policy.limit, tokens + tokensToAdd)
        lastRefillTime = now;

        // const ttl = await executeCommand('ttl', tokensKey);

        await executeCommand('set', tokensKey, tokens, 'KEEPTTL');
        await executeCommand('set', lastRefillKey, lastRefillTime, 'KEEPTTL');

    }

}