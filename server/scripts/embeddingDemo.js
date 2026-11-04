// Run with: GEMINI_API_KEY=... EMBEDDING_MODEL=... EMBEDDING_DIMENSIONS=... node server/scripts/embeddingDemo.js

require("dotenv").config()

const { GoogleGenAI } = require("@google/genai")

// Keep the sample documents and queries separate so each request uses the correct retrieval task.
const documents = [
  "Build REST APIs with Express and MongoDB",
  "Learn React hooks and state management",
  "Docker and Kubernetes for deployment",
  "Machine learning with Python and scikit-learn",
  "Cooking Italian pasta from scratch",
  "Data structures and algorithms in Java",
  "Node.js backend development with JWT authentication",
  "Beginner guitar chords",
]

const queries = [
  "how to create backend services",
  "make websites interactive",
  "learn to cook",
]

const requiredEnvironmentVariables = [
  "GEMINI_API_KEY",
  "EMBEDDING_MODEL",
  "EMBEDDING_DIMENSIONS",
]

// Fail early when the embedding configuration is incomplete.
const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name]
)

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing environment variables: ${missingEnvironmentVariables.join(", ")}`
  )
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const outputDimensionality = Number(process.env.EMBEDDING_DIMENSIONS)

if (!Number.isInteger(outputDimensionality) || outputDimensionality <= 0) {
  throw new Error("EMBEDDING_DIMENSIONS must be a positive integer")
}

// Request embeddings in batches and convert the SDK response into plain vectors.
const embedTexts = async (texts, taskType) => {
  const response = await ai.models.embedContent({
    model: process.env.EMBEDDING_MODEL,
    contents: texts.map((text) => ({
      role: "user",
      parts: [{ text }],
    })),
    config: {
      taskType,
      outputDimensionality,
    },
  })

  const embeddings = response.embeddings || []
  if (embeddings.length !== texts.length) {
    throw new Error(
      `Expected ${texts.length} embeddings, received ${embeddings.length}`
    )
  }

  return embeddings.map((embedding) => embedding.values)
}

// Calculate cosine similarity as the normalized dot product of two vectors.
const cosineSimilarity = (left, right) => {
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

const main = async () => {
  // Embed course texts as documents for retrieval.
  const documentEmbeddings = await embedTexts(documents, "RETRIEVAL_DOCUMENT")

  // Show the embedding shape and a small sample without printing full vectors.
  console.log(`Vector length: ${documentEmbeddings[0].length}`)
  console.log("First 5 numbers:", documentEmbeddings[0].slice(0, 5))

  // Embed each search query using the query-specific retrieval task.
  const queryEmbeddings = await embedTexts(queries, "RETRIEVAL_QUERY")

  // Rank every document for each query by descending cosine similarity.
  queries.forEach((query, queryIndex) => {
    const rankedResults = documents
      .map((text, documentIndex) => ({
        text,
        score: cosineSimilarity(
          queryEmbeddings[queryIndex],
          documentEmbeddings[documentIndex]
        ),
      }))
      .sort((left, right) => right.score - left.score)

    console.log(`\nQuery: ${query}`)
    rankedResults.forEach((result, rank) => {
      console.log(`${rank + 1}. ${result.score.toFixed(3)} - ${result.text}`)
    })
  })
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
