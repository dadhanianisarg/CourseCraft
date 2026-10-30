// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayment, verifyPayment, sendPaymentSuccessEmail } = require("../controllers/Payments")
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth")
const idempotency = require("../middlewares/idempotency")
router.post("/capturePayment", auth, isStudent, idempotency, capturePayment)
router.post("/verifyPayment",auth, isStudent, idempotency, verifyPayment)
router.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail);

module.exports = router