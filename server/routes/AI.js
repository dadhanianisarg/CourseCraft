const express = require("express")
const { rateLimit } = require("express-rate-limit")
const { auth, isInstructor } = require("../middlewares/auth")
const { generateCourseDraft } = require("../controllers/AI")

const router = express.Router()

const courseDraftLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => req.user.id,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "AI draft limit reached. Please try again later.",
    }),
})

// Authenticate and authorize before rate limiting so limits apply per instructor, not per shared IP.
router.post(
  "/course-draft",
  auth,
  isInstructor,
  courseDraftLimiter,
  generateCourseDraft
)

module.exports = router
