const mongoose = require('mongoose');
const {Schema} = require('mongoose');

const logSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        require: false,
        trim: true,
    },
    lastName: {
        type: String,
        require: false,
        trim: true,
    },
    username: {
        type: String,
        require: false,
        trim: true,
    },
    history: [
        {
            action: {
                type: String,
                require: true,
            },
            monitoring: {
                type: String,
                require: false,
                trim: true,
            },
            timestamp: {
                type: Date,
                default: getTime,
            },
        },
    ],
});

function getTime() {
    return new Date();
}

module.exports = mongoose.model('logs', logSchema);
