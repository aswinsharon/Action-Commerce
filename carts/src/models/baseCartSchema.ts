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

const baseCartSchema = new Schema({
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

const BaseCart = mongoose.model('BaseCart', baseCartSchema);

export default BaseCart;