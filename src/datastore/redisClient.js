const { createClient } = require('redis');
const { ThrottleCoreException } = require('../utils/exceptions')
const { REDIS_CONN_FAILURE_CODE, REDIS_CONN_FAILURE_MESSAGE, REDIS_COMMAND_FAILURE_CODE } = require('../utils/constants');

let redisClient;


/**
 * initRedisClient
 * 
 * Initializes a new Redis Client and connects it to the Redis Server
 * 
 * @param {Object} redisConfig Redis Config
 * 
 * @returns {Promise<Object>} redisClient instance
 */
module.exports.initRedisClient = async function (redisConfig) {
    redisClient = createClient({ url: redisConfig.url })

    redisClient.on('error', (error) => {
        console.error(`error occurred in initRedisClient function :: ${JSON.stringify(error)}`)
        throw ThrottleCoreException(REDIS_CONN_FAILURE_CODE, REDIS_CONN_FAILURE_MESSAGE)
    })

    redisClient.on('connect', () => {
        console.log('Redis connected successfully');
    })

    await redisClient.connect()

    return redisClient;
}

/**
 * executeCommand
 * 
 * Executes Redis Commands and handles failures consistently
 * 
 * @param {String} command Redis Command Name
 * @param {Array} args Arguments For Redis Command
 * 
 * @returns {void}
 */
module.exports.executeCommand = async function (command, ...args) {
    if (!redisClient) {
        throw ThrottleCoreException(REDIS_CONN_FAILURE_CODE, REDIS_CONN_FAILURE_MESSAGE)
    }

    try {
        const cmd = command.toLowerCase();

        const normalizedArgs = args.map(arg =>
            typeof arg === "number" ? String(arg) : arg
        );

        if (typeof redisClient.sendCommand === "function") {
            return await redisClient.sendCommand([cmd.toUpperCase(), ...normalizedArgs]);
        }

        if (typeof redisClient[cmd] === "function") {
            return await redisClient[cmd](...normalizedArgs);
        }

        throw new Error(`Invalid Redis command: ${cmd}`);
    } catch (error) {
        throw ThrottleCoreException(REDIS_COMMAND_FAILURE_CODE, `Failed to execute Redis ${command} command`);
    }
}