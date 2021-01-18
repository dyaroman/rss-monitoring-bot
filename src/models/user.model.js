const mongoose = require('mongoose');
const {Schema} = require('mongoose');


const userSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    monitorings: [String]
});


module.exports = mongoose.model('users', userSchema);
