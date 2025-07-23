const { Schema, default: mongoose } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const categoryShema = new Schema({
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
},
    {
        versionKey: false, // disables __v(versioning)
    }
);

const category = mongoose.model('category', categoryShema);

module.exports = category;