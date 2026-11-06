const { GoogleGenAI } = require("@google/genai")

const REQUEST_TIMEOUT_MS = 20000
const MAX_RETRIES = 2
const BATCH_SIZE = 10
const BATCH_DELAY_MS = 1000

const getEmbeddingModel = () =>
  process.env.EMBEDDING_MODEL || "gemini-embedding-001"

const getEmbeddingDimensions = () => {
  const dimensions = Number(process.env.EMBEDDING_DIMENSIONS)
  return Number.isInteger(dimensions) && dimensions > 0 ? dimensions : 768
}

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const getErrorStatus = (error) =>
  error?.status || error?.statusCode || error?.response?.status

const isRetryable = (error) => {
  const status = getErrorStatus(error)
  return status === 429 || (status >= 500 && status <= 599)
}

const validateEmbedding = (embedding, dimensions) => {
  if (!Array.isArray(embedding) || embedding.length !== dimensions) {
    throw new Error(
      `Embedding vector length ${embedding?.length || 0} does not match configured dimensions ${dimensions}`
    )
  }

  return embedding
}

const requestEmbedding = async ({ text, taskType, title }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const model = getEmbeddingModel()
  const dimensions = getEmbeddingDimensions()
  const config = {
    taskType,
    outputDimensionality: dimensions,
    ...(title ? { title } : {}),
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await ai.models.embedContent({
        model,
        contents: text,
        config: {
          ...config,
          abortSignal: controller.signal,
        },
      })
      const values = response.embeddings?.[0]?.values

      return validateEmbedding(values, dimensions)
    } catch (error) {
      if (attempt === MAX_RETRIES || !isRetryable(error)) {
        throw error
      }
      await sleep(250 * 2 ** attempt)
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error("The embedding request could not be completed")
}

const embedDocuments = async (items) => {
  const embeddings = []

  for (let start = 0; start < items.length; start += BATCH_SIZE) {
    const batch = items.slice(start, start + BATCH_SIZE)
    const batchEmbeddings = []

    for (const item of batch) {
      batchEmbeddings.push(
        await requestEmbedding({
          text: item.text,
          title: item.title,
          // Documents describe searchable content; queries describe user intent.
          taskType: "RETRIEVAL_DOCUMENT",
        })
      )
    }

    embeddings.push(...batchEmbeddings)

    if (start + BATCH_SIZE < items.length) {
      // Delay batches to reduce pressure on free-tier embedding limits.
      await sleep(BATCH_DELAY_MS)
    }
  }

  return embeddings
}

const embedQuery = (text) =>
  requestEmbedding({
    text,
    // Both sides must use the same model and dimensions for cosine similarity.
    taskType: "RETRIEVAL_QUERY",
  })

const cosineSimilarity = (left, right) => {
  if (
    !Array.isArray(left) ||
    !Array.isArray(right) ||
    left.length === 0 ||
    right.length === 0 ||
    left.length !== right.length
  ) {
    return 0
  }

  let dotProduct = 0
  let leftNormSquared = 0
  let rightNormSquared = 0

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index]
    leftNormSquared += left[index] ** 2
    rightNormSquared += right[index] ** 2
  }

  const denominator = Math.sqrt(leftNormSquared) * Math.sqrt(rightNormSquared)
  return denominator === 0 ? 0 : dotProduct / denominator
}

module.exports = {
  embedDocuments,
  embedQuery,
  cosineSimilarity,
}
