const express = require('express');
const router = express.Router();

router.get('/', getProducts);
router.get('/:productId', getProductById);

router.post('/', createProduct);

router.put('/:productId', updateProductById);
router.put('/:productId/images', updateProductImages);

router.delete('/:productId', deleteProductById);

router.head('/', headProducts);
router.head('/:productId', headProductById);