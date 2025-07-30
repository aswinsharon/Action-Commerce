import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const categorySchema = new Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },
    version: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    lastModifiedAt: {
        type: Date,
        required: true
    },
    lastModifiedBy: {
        clientId: {
            type: String,
            required: true
        },
        isPlatformClient: {
            type: Boolean,
            required: true
        }
    },
    createdBy: {
        clientId: {
            type: String,
            required: true
        },
        isPlatformClient: {
            type: Boolean,
            required: true
        }
    },
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
}
);

const category = mongoose.model('category', categorySchema);

export default category;