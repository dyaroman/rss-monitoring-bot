const mongoose = require('mongoose');
const {Schema} = require('mongoose');

const resultSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: false,
    },
    timestamp: {
        type: Date,
        default: getTime,
    },
    performance: {
        type: String,
        require: false,
    },
    monitorings: [
        {
            monitoring: {
                type: String,
                require: true,
                trim: true,
            },
            results: [
                {
                    title: {
                        type: String,
                        require: true,
                        trim: true,
                    },
                    url: {
                        type: String,
                        require: true,
                        trim: true,
                    },
                },
            ],
        },
    ],
});

function getTime() {
    return new Date();
}

module.exports = mongoose.model('results', resultSchema);
