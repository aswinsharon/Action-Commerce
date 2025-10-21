import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const priceSchema = new Schema({
    value: {
        type: {
            type: String,
            required: true,
            default: "centPrecision"
        },
        fractionDigits: {
            type: Number,
            required: true,
            default: 2
        },
        centAmount: {
            type: Number,
            required: true
        },
        currencyCode: {
            type: String,
            required: true,
            default: "EUR"
        }
    },
    id: {
        type: String,
        default: uuidv4
    }
});

const imageSchema = new Schema({
    dimensions: {
        h: { type: Number, required: true },
        w: { type: Number, required: true }
    },
    url: {
        type: String,
        required: true
    }
});

const variantSchema = new Schema({
    attributes: [Schema.Types.Mixed],
    id: {
        type: Number,
        required: true
    },
    images: [imageSchema],
    prices: [priceSchema],
    sku: {
        type: String,
        required: true
    }
});

const masterDataSchema = new Schema({
    current: {
        categories: [{
            id: { type: String, required: true },
            typeId: { type: String, required: true, default: "category" }
        }],
        description: {
            type: Map,
            of: String,
            required: true
        },
        masterVariant: variantSchema,
        name: {
            type: Map,
            of: String,
            required: true
        },
        slug: {
            type: Map,
            of: String,
            required: true
        },
        variants: [variantSchema],
        searchKeywords: {
            type: Map,
            of: [String],
            default: {}
        },
        attributes: [Schema.Types.Mixed]
    },
    hasStagedChanges: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: true
    },
    staged: {
        categories: [{
            id: { type: String, required: true },
            typeId: { type: String, required: true, default: "category" }
        }],
        description: {
            type: Map,
            of: String,
            required: true
        },
        masterVariant: variantSchema,
        name: {
            type: Map,
            of: String,
            required: true
        },
        slug: {
            type: Map,
            of: String,
            required: true
        },
        variants: [variantSchema],
        searchKeywords: {
            type: Map,
            of: [String],
            default: {}
        },
        attributes: [Schema.Types.Mixed]
    }
});

const productSchema = new Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },
    version: {
        type: Number,
        required: true,
        default: 1
    },
    masterData: masterDataSchema,
    productType: {
        id: { type: String, required: true },
        typeId: { type: String, required: true, default: "product-type" }
    },
    taxCategory: {
        id: { type: String, required: true },
        typeId: { type: String, required: true, default: "tax-category" }
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
    }
});

const Product = mongoose.model('Product', productSchema);

export default Product;