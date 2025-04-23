const mongoose = require('mongoose');

const modSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('Mod', modSchema);