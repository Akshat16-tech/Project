const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // Changed type to String for password
    email: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
