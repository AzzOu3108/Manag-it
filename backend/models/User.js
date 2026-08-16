const mongoose = require('mongoose');


const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never returned by default
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true, // expose `id` instead of `_id`
      versionKey: false,
    },
  }
);

const User = mongoose.model('User', userSchema)

module.exports = User