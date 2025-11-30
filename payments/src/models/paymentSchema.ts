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

const transactionSchema = new Schema({
    id: {
        type: String,
        default: uuidv4,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["Authorization", "Charge", "Refund", "CancelAuthorization"],
        required: true
    },
    amount: {
        type: moneySchema,
        required: true
    },
    interactionId: {
        type: String,
        required: false
    },
    state: {
        type: String,
        enum: ["Initial", "Pending", "Success", "Failure"],
        required: true
    }
}, { _id: false });

const paymentSchema = new Schema({
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
    amountPlanned: {
        type: moneySchema,
        required: true
    },
    customer: {
        type: referenceSchema,
        required: false
    },
    paymentMethodInfo: {
        paymentInterface: {
            type: String,
            required: false
        },
        method: {
            type: String,
            required: false
        },
        name: {
            type: Map,
            of: String,
            required: false
        }
    },
    paymentStatus: {
        interfaceCode: {
            type: String,
            required: false
        },
        interfaceText: {
            type: String,
            required: false
        },
        state: {
            type: referenceSchema,
            required: false
        }
    },
    transactions: {
        type: [transactionSchema],
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

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
