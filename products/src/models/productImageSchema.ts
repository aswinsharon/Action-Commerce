import mongoose from 'mongoose';

const ProductImageSchema = new mongoose.Schema({
    productId: {
        type: String,
        ref: 'Product',
        required: true,
    },
    type: String,
    url: String,
    alt: String,
});

module.exports = mongoose.model('ProductImage', ProductImageSchema);