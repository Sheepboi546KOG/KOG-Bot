const { Schema, model } = require('mongoose');

const eventSchema = new Schema({
    uuid: {
        type: String,
        unique: true,
        required: true,
    },
    host: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = model('Event', eventSchema);