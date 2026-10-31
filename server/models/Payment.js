const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Course",
  }],
  amount: {
    type: Number,
    required: true,
  },
  razorpay_order_id: {
    type: String,
    required: true,
    unique: true,
  },
  razorpay_payment_id: {
    type: String,
    unique: true,
    sparse: true,
  },
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

paymentSchema.index({ userId: 1, status: 1, createdAt: 1 })

module.exports = mongoose.model("Payment", paymentSchema)
