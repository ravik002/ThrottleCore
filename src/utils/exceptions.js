
/**
 * ThrottleCoreException
 * 
 * Build a new ThrottleCoreException object
 * 
 * @param {String} errorcode Error Code
 * @param {String} errormessage Error Message
 * @param {Array} details Detailed Context 
 * 
 * @returns {Object} ThrottleCoreException Object
 */
module.exports.ThrottleCoreException = function (errorcode, errormessage, details) {
    let errorObject = {}

    errorObject.errorcode = errorcode;
    errorObject.errormessage = errormessage;
    errorObject.detailedContext = details?.length ? details : []

    return errorObject;
}