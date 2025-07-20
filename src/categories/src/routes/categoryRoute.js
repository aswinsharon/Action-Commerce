const express = require('express');
const categoryController = require('../controllers/categoryController')
const router = express.Router();

// router.get('/', getCategories);
// router.get('/:cartegoryId', getCategoryById);

router.post('/', categoryController.createCategory);
// router.post('/:cartegoryId', updateCategory);

// router.delete('/:cartegoryId', deleteCategoryById);

// router.head('/', headCategories);
// router.head('/:cartegoryId', headCategoriesById);

module.exports = router