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

const priceSchema = new Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true
    },
    value: {
        type: moneySchema,
        required: true
    },
    country: {
        type: String,
        required: false
    },
    customerGroup: {
        type: referenceSchema,
        required: false
    },
    channel: {
        type: referenceSchema,
        required: false
    },
    validFrom: {
        type: String,
        required: false
    },
    validUntil: {
        type: String,
        required: false
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
    prices: {
        type: [priceSchema],
        default: []
    },
    attributes: {
        type: [attributeSchema],
        default: []
    },
    images: {
        type: [imageSchema],
        default: []
    },
    availability: {
        isOnStock: {
            type: Boolean,
            default: true
        },
        availableQuantity: {
            type: Number,
            default: 0
        }
    }
}, { _id: false });

const productDataSchema = new Schema({
    name: {
        type: Map,
        of: String,
        required: true
    },
    description: {
        type: Map,
        of: String,
        required: false
    },
    slug: {
        type: Map,
        of: String,
        required: true
    },
    categories: {
        type: [referenceSchema],
        default: []
    },
    categoryOrderHints: {
        type: Map,
        of: String,
        required: false
    },
    metaTitle: {
        type: Map,
        of: String,
        required: false
    },
    metaDescription: {
        type: Map,
        of: String,
        required: false
    },
    metaKeywords: {
        type: Map,
        of: String,
        required: false
    },
    masterVariant: {
        type: productVariantSchema,
        required: true
    },
    variants: {
        type: [productVariantSchema],
        default: []
    },
    searchKeywords: {
        type: Map,
        of: [String],
        required: false
    }
}, { _id: false });

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
    createdAt: {
        type: String,
        required: true
    },
    lastModifiedAt: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: false
    },
    productType: {
        type: referenceSchema,
        required: true
    },
    masterData: {
        current: {
            type: productDataSchema,
            required: true
        },
        staged: {
            type: productDataSchema,
            required: false
        },
        published: {
            type: Boolean,
            default: false
        },
        hasStagedChanges: {
            type: Boolean,
            default: false
        }
    },
    taxCategory: {
        type: referenceSchema,
        required: false
    },
    state: {
        type: referenceSchema,
        required: false
    },
    reviewRatingStatistics: {
        averageRating: {
            type: Number,
            default: 0
        },
        highestRating: {
            type: Number,
            default: 5
        },
        lowestRating: {
            type: Number,
            default: 1
        },
        count: {
            type: Number,
            default: 0
        },
        ratingsDistribution: {
            type: Map,
            of: Number,
            required: false
        }
    },
    priceMode: {
        type: String,
        enum: ["Platform", "Embedded"],
        default: "Platform"
    }
});

// Indexes for better query performance
productSchema.index({ key: 1 }, { unique: true, sparse: true });
productSchema.index({ 'masterData.current.slug': 1 });
productSchema.index({ 'masterData.current.categories.id': 1 });
productSchema.index({ 'masterData.published': 1 });

// Indexes for SKU lookups (critical for inventory and variant queries)
productSchema.index({ 'masterData.current.masterVariant.sku': 1 });
productSchema.index({ 'masterData.current.variants.sku': 1 });
productSchema.index({ 'masterData.staged.masterVariant.sku': 1 });
productSchema.index({ 'masterData.staged.variants.sku': 1 });

// Indexes for price range queries
productSchema.index({ 'masterData.current.masterVariant.prices.value.centAmount': 1 });
productSchema.index({ 'masterData.current.variants.prices.value.centAmount': 1 });

// Compound index for published products with categories (common query pattern)
productSchema.index({ 'masterData.published': 1, 'masterData.current.categories.id': 1 });

// Index for attribute-based searches
productSchema.index({ 'masterData.current.masterVariant.attributes.name': 1, 'masterData.current.masterVariant.attributes.value': 1 });
productSchema.index({ 'masterData.current.variants.attributes.name': 1, 'masterData.current.variants.attributes.value': 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
