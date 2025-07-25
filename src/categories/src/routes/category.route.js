/**
 * @fileoverview Express router for handling category-related API endpoints.
 * This router includes routes for retrieving, creating, updating, and deleting categories,
 * as well as HEAD requests to check category resources.
 */

const express = require('express');
const categoryController = require('../controllers/category.controller');
const router = express.Router();

/**
 * GET /
 * Retrieves a list of all categories.
 * 
 * @route GET /categories
 * @returns {Array<Object>} 200 - An array of category objects
 * @returns {Error} 500 - Internal server error
 */
router.get('/', categoryController.getAllCategories);

/**
 * GET /:categoryId
 * Retrieves details of a single category by its ID.
 * 
 * @route GET /categories/:categoryId
 * @param {string} categoryId - ID of the category
 * @returns {Object} 200 - Category object
 * @returns {Error} 404 - Category not found
 */
router.get('/:categoryId', categoryController.getCategoryById);

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
 * POST /:categoryId
 * Updates an existing category by its ID.
 * 
 * @route POST /categories/:categoryId
 * @param {string} categoryId - ID of the category
 * @body {string} name - Updated name of the category
 * @returns {Object} 200 - Updated category object
 * @returns {Error} 404 - Category not found
 */
// router.post('/:categoryId', categoryController.updateCategory);

/**
 * DELETE /:categoryId
 * Deletes a category by its ID.
 * 
 * @route DELETE /categories/:categoryId
 * @param {string} categoryId - ID of the category
 * @returns {string} 200 - Success message
 * @returns {Error} 404 - Category not found
 */
router.delete('/:categoryId', categoryController.deleteCategoryById);

/**
 * HEAD /:categoryId
 * Sends metadata for a specific category.
 * 
 * @route HEAD /categories/:categoryId
 * @param {string} categoryId - ID of the category
 * @returns {Headers} 200 - Headers indicating resource metadata
 * @returns {Error} 404 - Category not found
 */
router.head('/:categoryId', categoryController.headCategoryById);

/**
 * HEAD /
 * Sends metadata for the categories collection without the actual data.
 * 
 * @route HEAD /categories
 * @returns {Headers} 200 - Headers indicating resource metadata
 */
router.head('/', categoryController.headCategories);

module.exports = router;