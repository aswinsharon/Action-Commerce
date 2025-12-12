import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const moneySchema = new Schema({
    centAmount: {
        type: Number,
        required: true
    },
    currencyCode: {
        type: String,
        required: true
    }
}, { _id: false });

const customLineItemSchema = new Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },
    cartId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: Map,
        of: String,
        required: true
    },
    money: {
        type: moneySchema,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: moneySchema,
        required: true
    },
    createdAt: {
        type: String,
        required: true
    },
    lastModifiedAt: {
        type: String,
        required: true
    }
});

// Index for efficient cart-based queries
customLineItemSchema.index({ cartId: 1 });

const CustomLineItem = mongoose.model('CustomLineItem', customLineItemSchema);

export default CustomLineItem;