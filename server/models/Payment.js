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
    enum: ["processing", "completed"],
    default: "processing",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("Payment", paymentSchema)
