const { Schema } = require('mongoose');

const lineItemSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    productId: {
        type: String,
        required: true
    },
    name: {
        type: Map,
        of: String,
        required: true
    },
    variant: {
        id: { type: Number, required: true },
        sku: { type: String, required: true }
    },
    price: {
        value: {
            type: {
                type: String,
                default: "centPrecision"
            },
            fractionDigits: { type: Number, default: 2 },
            centAmount: { type: Number, required: true },
            currencyCode: { type: String, default: "EUR" }
        }
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: {
            type: String,
            default: "centPrecision"
        },
        fractionDigits: { type: Number, default: 2 },
        centAmount: { type: Number, required: true },
        currencyCode: { type: String, default: "EUR" }
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = lineItemSchema;