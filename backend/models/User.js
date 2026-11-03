const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true, trim: true, lowercase: true,
    minlength: 3, maxlength: 24, match: /^[a-z0-9_]+$/
  },
  email: {
    type: String, required: true, unique: true, trim: true, lowercase: true,
    maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  // Only a bcrypt hash is stored; the original password is never persisted.
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
