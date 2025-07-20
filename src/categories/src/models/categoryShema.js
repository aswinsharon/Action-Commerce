const { Schema, default: mongoose } = require('mongoose');

const categoryShema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
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
    }
});

const category = mongoose.model('category', categoryShema);

module.exports = category;