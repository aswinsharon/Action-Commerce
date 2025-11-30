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
    id: {
        type: String,
        default: uuidv4,
        required: true
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
    }
}, { _id: false });

const customLineItemSchema = new Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true
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
    }
}, { _id: false });

const taxPortionSchema = new Schema({
    rate: {
        type: Number,
        required: true
    },
    amount: {
        type: moneySchema,
        required: true
    }
}, { _id: false });

const taxedPriceSchema = new Schema({
    totalNet: {
        type: moneySchema,
        required: true
    },
    totalGross: {
        type: moneySchema,
        required: true
    },
    taxPortions: {
        type: [taxPortionSchema],
        required: false
    }
}, { _id: false });

const addressSchema = new Schema({
    firstName: {
        type: String,
        required: false
    },
    lastName: {
        type: String,
        required: false
    },
    streetName: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: true
    }
}, { _id: false });

const shippingInfoSchema = new Schema({
    shippingMethodName: {
        type: String,
        required: true
    },
    price: {
        type: moneySchema,
        required: true
    }
}, { _id: false });

const discountCodeInfoSchema = new Schema({
    discountCode: {
        type: referenceSchema,
        required: true
    },
    state: {
        type: String,
        enum: ["NotActive", "MatchesCart", "MaxApplicationReached", "Applied"],
        required: true
    }
}, { _id: false });

const cartSchema = new Schema({
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
        required: false,
        unique: true,
        sparse: true
    },
    customerId: {
        type: String,
        required: false
    },
    customerEmail: {
        type: String,
        required: false
    },
    totalPrice: {
        type: moneySchema,
        required: true
    },
    taxedPrice: {
        type: taxedPriceSchema,
        required: false
    },
    lineItems: {
        type: [lineItemSchema],
        default: []
    },
    customLineItems: {
        type: [customLineItemSchema],
        default: []
    },
    cartState: {
        type: String,
        enum: ["Active", "Merged", "Ordered"],
        required: true,
        default: "Active"
    },
    shippingAddress: {
        type: addressSchema,
        required: false
    },
    billingAddress: {
        type: addressSchema,
        required: false
    },
    shippingInfo: {
        type: shippingInfoSchema,
        required: false
    },
    discountCodes: {
        type: [discountCodeInfoSchema],
        default: []
    },
    custom: {
        type: {
            type: referenceSchema,
            required: false
        },
        fields: {
            type: Map,
            of: Schema.Types.Mixed,
            required: false
        }
    }
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
