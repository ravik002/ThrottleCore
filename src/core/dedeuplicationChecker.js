const { executeCommand } = require("../datastore/redisClient")

/**
 * isDuplicate
 * 
 * Checks if a Duplicate Request is received in a given time window
 * 
 * @param {String} key Redis Key For Dedup Category
 * @param {Number} windowMs Window Size in Milliseconds
 * 
 * @returns {Promise<boolean>} 
 */
module.exports.isDuplicate = async function (key, windowMs) {
    const windowSeconds = Math.ceil(windowMs / 1000)

    const result = await executeCommand("set", key, 1, "EX", windowSeconds, "NX");

    return result === null;
}