import mongoose from 'mongoose';

const ProductVariantSchema = new mongoose.Schema({
    productId: {
        type: String,
        ref: 'Product',
        required: true,
    },
    type: String,
    url: String,
    alt: String,
});

module.exports = mongoose.model('ProductImage', ProductVariantSchema);