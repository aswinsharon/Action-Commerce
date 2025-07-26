const { v4: uuidv4 } = require('uuid');

const responseFormatter = ({ req, msg, data }) => {
    const returnObject = {
        success: true,
        message: msg,
        data: data ? data : {}
    };
    if (req) {
        returnObject.message = msg || constantCase(req.action.name).concat("_SUCCESS");
    }
    return returnObject;
};

const throwError = ({ ctx, msg, code, type, data, err }) => {
    if (err && err.name === "AppError") throw err;

    if (ctx) {
        msg = msg || constantCase(ctx.action.name).concat("_ERROR");
        type = type || ctx.action.name;
        data = data || { params: ctx.params };
    }

    if (err) {
        data.errorObject = errorParser(err);
    }

};

const buildbaseCreateBody = ({ version = 1, clientId, data }) => {
    const now = new Date().toISOString();
    const _id = uuidv4();
    return {
        _id,
        version,
        createdAt: now,
        lastModifiedAt: now,
        lastModifiedBy: {
            clientId,
            isPlatformClient: false
        },
        createdBy: {
            clientId,
            isPlatformClient: false
        },
        ...data
    };
};

// const paginate = async (model, query = {}, limit = 20, offset = 0, projection = null, options = {}) => {
//     const results = await model.find(query, projection, options).skip(offset).limit(limit);
//     const total = await model.countDocuments(query);
//     return {
//         limit,
//         offset,
//         count: results.length,
//         total,
//         results,
//     };
// };

module.exports = {
    buildbaseCreateBody
}