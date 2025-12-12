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

const referenceSchema = new Schema({
    typeId: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    }
}, { _id: false });

const imageSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: false
    },
    dimensions: {
        w: { type: Number, required: true },
        h: { type: Number, required: true }
    }
}, { _id: false });

const attributeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: Schema.Types.Mixed,
        required: true
    }
}, { _id: false });

const productVariantSchema = new Schema({
    id: {
        type: Number,
        required: true
    },
    sku: {
        type: String,
        required: false
    },
    key: {
        type: String,
        required: false
    },
    attributes: {
        type: [attributeSchema],
        required: false
    },
    images: {
        type: [imageSchema],
        required: false
    }
}, { _id: false });

const priceSchema = new Schema({
    value: {
        type: moneySchema,
        required: true
    },
    discounted: {
        value: {
            type: moneySchema,
            required: false
        },
        discount: {
            type: referenceSchema,
            required: false
        }
    }
}, { _id: false });

const lineItemSchema = new Schema({
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
    productId: {
        type: String,
        required: true
    },
    productType: {
        type: referenceSchema,
        required: true
    },
    name: {
        type: Map,
        of: String,
        required: true
    },
    variant: {
        type: productVariantSchema,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: priceSchema,
        required: true
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
lineItemSchema.index({ cartId: 1 });

const LineItem = mongoose.model('LineItem', lineItemSchema);

export default LineItem;