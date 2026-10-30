const mongoose = require("mongoose")

const idempotencyKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  endpoint: {
    type: String,
    required: true,
  },
  requestHash: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["processing", "completed"],
    required: true,
  },
  responseStatus: Number,
  responseBody: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
})

idempotencyKeySchema.index({ userId: 1, key: 1, endpoint: 1 }, { unique: true })

module.exports = mongoose.model("IdempotencyKey", idempotencyKeySchema)
