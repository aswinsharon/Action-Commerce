const mongoose = require('mongoose');
const lineItemSchema = new mongoose.Schema({
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