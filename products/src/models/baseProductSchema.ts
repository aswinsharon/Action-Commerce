import mongoose from "mongoose";

const ReferenceSchema = new mongoose.Schema({
    id: { type: String, required: true },
    typeId: { type: String, required: true }
}, { _id: false });

const AttributeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    version: { type: Number, required: true },

    categories: { type: [ReferenceSchema], default: [] },

    description: {
        type: Map,
        of: String,
        default: {}
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

    searchKeywords: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },

    attributes: { type: [AttributeSchema], default: [] },

    productType: { type: ReferenceSchema, required: true },

    taxCategory: { type: ReferenceSchema, required: true },

    createdAt: { type: Date, required: true },
    lastModifiedAt: { type: Date, required: true }
}, { timestamps: false });

export default mongoose.model("Product", ProductSchema);