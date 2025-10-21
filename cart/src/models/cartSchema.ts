import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
const lineItemSchema = require('./lineItemSchema');

const cartSchema = new Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },
    type: {
        type: String,
        default: "Cart",
        required: true
    },
    version: {
        type: Number,
        required: true,
        default: 1
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastModifiedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastModifiedBy: {
        isPlatformClient: {
            type: Boolean,
            default: false
        },
        userId: String
    },
    createdBy: {
        isPlatformClient: {
            type: Boolean,
            default: false
        },
        userId: String
    },
    customerId: {
        type: String,
        required: true
    },
    lineItems: [lineItemSchema],
    cartState: {
        type: String,
        enum: ["Active", "Merged", "Ordered"],
        default: "Active"
    },
    totalPrice: {
        type: {
            type: String,
            default: "centPrecision"
        },
        currencyCode: {
            type: String,
            default: "EUR"
        },
        centAmount: {
            type: Number,
            default: 0
        },
        fractionDigits: {
            type: Number,
            default: 2
        }
    },
    shippingMode: {
        type: String,
        default: "Single"
    },
    shipping: {
        type: [Schema.Types.Mixed],
        default: []
    },
    customLineItems: {
        type: [Schema.Types.Mixed],
        default: []
    },
    discountCodes: {
        type: [Schema.Types.Mixed],
        default: []
    },
    directDiscounts: {
        type: [Schema.Types.Mixed],
        default: []
    },
    inventoryMode: {
        type: String,
        default: "None"
    },
    taxMode: {
        type: String,
        default: "Platform"
    },
    priceRoundingMode: {
        type: String,
        default: "HalfEven"
    },
    taxRoundingMode: {
        type: String,
        default: "HalfEven"
    },
    taxCalculationMode: {
        type: String,
        default: "LineItemLevel"
    },
    refusedGifts: {
        type: [Schema.Types.Mixed],
        default: []
    },
    origin: {
        type: String,
        default: "Customer"
    },
    itemShippingAddresses: {
        type: [Schema.Types.Mixed],
        default: []
    }
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;