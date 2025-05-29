const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    reason: {
        type: String,
        required: true,
    },
    bannedBy: {
        type: String,
        required: true,
    },
    bannedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    active: {
        type: Boolean,
        default: true,
    }
});

module.exports = mongoose.model('Ban', banSchema);