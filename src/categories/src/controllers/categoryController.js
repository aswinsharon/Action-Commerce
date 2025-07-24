const model = require('../models/categoryShema');
const { buildbaseCreateBody, paginate } = require('../utils/utilities');

const getCategories = async (request, response) => {
    const getCategoriesResponse = await paginate(model);
    response.status(200).json(getCategoriesResponse)
};

const createCategory = async (request, response) => {
    const data = request.body;
    const clientId = request?.headers['x-client-id'] || '';
    if (!clientId) {
        throw new Error("ClientId missing in the header")
    }
    const createCategoryBody = buildbaseCreateBody({ clientId, data });
    const createCategoryResponse = await model.insertOne(createCategoryBody);
    response.status(201).json(createCategoryResponse);
};

module.exports = {
    createCategory,
    getCategories
}