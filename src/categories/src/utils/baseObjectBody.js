const { v4: uuidv4 } = require('uuid');

const buildbaseCreateBody = ({ version = 1, clientId, data = {} }) => {
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
}

module.exports = {
    buildbaseCreateBody
}