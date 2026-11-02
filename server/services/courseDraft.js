const { chat } = require("./llm")
const { courseDraftOutputSchema, courseDraftOutputJsonSchema } = require("../validators/aiSchemas")
const extractJson = require("../utils/extractJson")
const { SYSTEM, buildUserPrompt } = require("../prompts/courseDraft")

const generateCourseDraft = async (input) => {
  const messages = [{ role: "user", content: buildUserPrompt(input) }]
  let feedback = ""
  let previousResponseText = ""

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await chat({
      system: SYSTEM,
      messages: feedback
        ? [
            ...messages,
            { role: "assistant", content: previousResponseText },
            { role: "user", content: feedback },
          ]
        : messages,
      maxTokens: 1400,
      jsonSchema: courseDraftOutputJsonSchema,
    })
    const responseText = response.text
    previousResponseText = responseText

    console.log("Course draft attempt", {
      attempt,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      finishReason: response.finishReason,
    })

    if (response.finishReason === "MAX_TOKENS" || !responseText.trim()) {
      feedback = response.finishReason === "MAX_TOKENS"
        ? "The previous response was truncated. Return the complete corrected JSON object only."
        : "The previous response was empty. Return the complete JSON object only."
      continue
    }

    try {
      const parsed = JSON.parse(extractJson(responseText))
      return courseDraftOutputSchema.parse(parsed)
    } catch (error) {
      feedback = `The previous response was invalid: ${error.message}. Return corrected JSON only.`
    }
  }

  throw new Error("The AI could not produce a valid course draft")
}

module.exports = { generateCourseDraft }
