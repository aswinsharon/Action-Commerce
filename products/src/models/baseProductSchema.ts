import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const productSchema = new Schema({
    _id: {
        type: String,
        default: uuidv4,
        required: true
    },
    categories: {
        type: [String],
        required: true
    },
    deployOnSave: {
        type: Boolean,
        default: false
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

const Category = mongoose.model('product', productSchema);

export default Category;