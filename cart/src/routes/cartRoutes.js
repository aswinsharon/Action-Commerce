const express = require('express');
const router = express.Router();

router.get('/', getCarts());
router.get('/:cartId', getCartById());
router.get('/customerId=:id', getCartByCustomerId());

router.post('/', createCart());
router.post('/:cartId', updateCartById());

router.delete('/:cartId', deleteCartById());

router.head('/', headProducts());
router.head('/:cartId', headProductsById());