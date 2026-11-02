const { GoogleGenAI } = require("@google/genai")

// Keep the request below Render's request window while allowing Gemini cold starts.
const REQUEST_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 90000)
const MAX_RETRIES = 2

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const getErrorStatus = (error) =>
  error?.status || error?.statusCode || error?.response?.status

const isRetryable = (error) => {
  const status = getErrorStatus(error)
  return status === 429 || (status >= 500 && status <= 599)
}

const chat = async ({
  system,
  messages,
  maxTokens = 2000,
  temperature = 0.7,
  jsonSchema,
}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }))
  const config = {
    systemInstruction: system,
    maxOutputTokens: maxTokens,
    temperature,
    thinkingConfig: {
      // Keep thinking minimal so hidden reasoning does not consume the JSON output budget.
      thinkingBudget: 0,
    },
    ...(jsonSchema
      ? {
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
        }
      : {}),
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await ai.models.generateContent({
        model: process.env.LLM_MODEL,
        contents,
        config: {
          ...config,
          abortSignal: controller.signal,
        },
      })
      const candidate = response.candidates?.[0]
      const text = response.text || ""

      return {
        text,
        finishReason: candidate?.finishReason,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        },
      }
    } catch (error) {
      if (attempt === MAX_RETRIES || !isRetryable(error)) {
        throw error
      }
      await sleep(250 * 2 ** attempt)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error("The AI request could not be completed")
}

module.exports = { chat }
