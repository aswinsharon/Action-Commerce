import mongoose from "mongoose";

const DimensionsSchema = new mongoose.Schema({
    h: { type: Number, required: true },
    w: { type: Number, required: true }
}, { _id: false });

const ImageSchema = new mongoose.Schema({
    dimensions: { type: DimensionsSchema, required: true },
    url: { type: String, required: true }
}, { _id: false });

const PriceValueSchema = new mongoose.Schema({
    type: { type: String, enum: ["centPrecision"], required: true },
    fractionDigits: { type: Number, required: true },
    centAmount: { type: Number, required: true },
    currencyCode: { type: String, required: true }
}, { _id: false });

const PriceSchema = new mongoose.Schema({
    value: { type: PriceValueSchema, required: true },
    id: { type: String, required: true }
}, { _id: false });

const VariantAttributeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const ProductVariantSchema = new mongoose.Schema({
    productId: { type: String, ref: "Product", required: true },
    id: { type: Number, required: true },
    images: { type: [ImageSchema], default: [] },
    prices: { type: [PriceSchema], default: [] },
    attributes: { type: [VariantAttributeSchema], default: [] },
    isMaster: { type: Boolean, default: false }
});

export default mongoose.model("ProductVariant", ProductVariantSchema);