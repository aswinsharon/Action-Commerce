/**
 * @fileoverview Express router for handling category-related API endpoints.
 * This router includes routes for retrieving, creating, updating, and deleting categories,
 * as well as HEAD requests to check category resources.
 */

const express = require('express');
const categoryController = require('../controllers/categoryController');
const router = express.Router();

/**
 * GET /
 * Retrieves a list of all categories.
 * 
 * @route GET /categories
 * @returns {Array<Object>} 200 - An array of category objects
 * @returns {Error} 500 - Internal server error
 */
// router.get('/', categoryController.getCategories);

/**
 * GET /:cartegoryId
 * Retrieves details of a single category by its ID.
 * 
 * @route GET /categories/:cartegoryId
 * @param {string} cartegoryId - ID of the category
 * @returns {Object} 200 - Category object
 * @returns {Error} 404 - Category not found
 */
// router.get('/:cartegoryId', categoryController.getCategoryById);

/**
 * POST /
 * Creates a new category.
 * 
 * @route POST /categories
 * @body {string} name - Name of the category
 * @returns {Object} 201 - Newly created category object
 * @returns {Error} 400 - Invalid request data
 */
router.post('/', categoryController.createCategory);

/**
 * POST /:cartegoryId
 * Updates an existing category by its ID.
 * 
 * @route POST /categories/:cartegoryId
 * @param {string} cartegoryId - ID of the category
 * @body {string} name - Updated name of the category
 * @returns {Object} 200 - Updated category object
 * @returns {Error} 404 - Category not found
 */
// router.post('/:cartegoryId', categoryController.updateCategory);

/**
 * DELETE /:cartegoryId
 * Deletes a category by its ID.
 * 
 * @route DELETE /categories/:cartegoryId
 * @param {string} cartegoryId - ID of the category
 * @returns {string} 200 - Success message
 * @returns {Error} 404 - Category not found
 */
// router.delete('/:cartegoryId', categoryController.deleteCategoryById);

/**
 * HEAD /
 * Sends metadata for the categories collection without the actual data.
 * 
 * @route HEAD /categories
 * @returns {Headers} 200 - Headers indicating resource metadata
 */
// router.head('/', categoryController.headCategories);

/**
 * HEAD /:cartegoryId
 * Sends metadata for a specific category.
 * 
 * @route HEAD /categories/:cartegoryId
 * @param {string} cartegoryId - ID of the category
 * @returns {Headers} 200 - Headers indicating resource metadata
 * @returns {Error} 404 - Category not found
 */
// router.head('/:cartegoryId', categoryController.headCategoriesById);

module.exports = router;