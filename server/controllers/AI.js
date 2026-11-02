const { courseDraftInputSchema } = require("../validators/aiSchemas")
const { generateCourseDraft } = require("../services/courseDraft")

exports.generateCourseDraft = async (req, res) => {
  const validation = courseDraftInputSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid course draft input",
      errors: validation.error.flatten().fieldErrors,
    })
  }

  try {
    const data = await generateCourseDraft(validation.data)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error("Course draft generation failed:", error)
    if (error.status === 429 || error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: "The AI service is busy. Please try again shortly.",
      })
    }
    return res.status(502).json({
      success: false,
      message: "The AI service could not generate a course draft.",
    })
  }
}
