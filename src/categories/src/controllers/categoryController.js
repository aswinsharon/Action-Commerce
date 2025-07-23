const category = require('../models/categoryShema');
const baseObject = require('../utils/utilities');

const getCategories = async (request, response) => {

}
const createCategory = async (request, response) => {
    // console.log('request-->', request);
    const data = request.body;
    const clientId = request?.headers['x-client-id'] || '';
    if (!clientId) {
        throw new Error("ClientId missing in the header")
    }
    const createCategoryBody = baseObject.buildbaseCreateBody({ clientId, data });
    const createCategoryResponse = await category.insertOne(createCategoryBody);
    response.json({
        message: JSON.stringify(createCategoryResponse)
    });
}

module.exports = {
    createCategory
}