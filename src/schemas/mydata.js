const mongoose = require('mongoose');

const myDataSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    eventsAttended: {
        type: Number,
        default: 0
    },
    eventsHosted: {
        type: Number,
        default: 0
    },
    merits: {
        type: Number,
        default: 0
    },
    TrainingsAttended: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('mydata', myDataSchema);