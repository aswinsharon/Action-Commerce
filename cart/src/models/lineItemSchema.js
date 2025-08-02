const { Schema } = require('mongoose');

const lineItemSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    productId: {
        type: String,
        required: true,
        unique: true
    }
})