const category = require('../models/categoryShema');
const baseObject = require('../utils/baseObjectBody');

const createCategory = async (request, response) => {
    const createCategoryInformation = request.body;
    const clientId = request?.headers['x-client-id'] || '';
    const createCategoryBody = baseObject.buildbaseCreateBody({ clientId, createCategoryInformation });
    const createCategoryResponse = await category.insertOne(createCategoryInformation);
    console.log(createCategoryResponse);
}