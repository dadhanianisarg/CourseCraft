const Course = require("../models/Course")
require("../models/User")
require("../models/RatingAndRaview")
const { embedQuery, cosineSimilarity } = require("../services/embeddings")
const { semanticSearchSchema } = require("../validators/semanticSearchSchemas")

const queryEmbeddingCache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 200
const COURSE_CARD_SELECT =
  "courseName courseDescription tag category thumbnail price instructor ratingAndReviews"
const getMinimumScore = () => Number(process.env.SEMANTIC_MIN_SCORE || 0.5)

const populateCourseCardFields = (query) =>
  query
    .select(`${COURSE_CARD_SELECT} +embedding`)
    .populate({ path: "instructor", select: "firstName lastName" })
    .populate("ratingAndReviews")

const removeEmbedding = (course) => {
  const plainCourse = course.toObject ? course.toObject() : { ...course }
  delete plainCourse.embedding
  return plainCourse
}

const getCachedQueryEmbedding = async (query) => {
  const cached = queryEmbeddingCache.get(query)
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.embedding
  }

  if (cached) {
    queryEmbeddingCache.delete(query)
  }

  const embedding = await embedQuery(query)

  // Cache repeated searches briefly to reduce embedding calls and free-tier usage.
  if (queryEmbeddingCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = queryEmbeddingCache.keys().next().value
    queryEmbeddingCache.delete(oldestKey)
  }
  queryEmbeddingCache.set(query, { embedding, createdAt: Date.now() })
  return embedding
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const keywordFallback = async (query, limit) => {
  const escapedQuery = escapeRegExp(query)
  const courses = await Course.find({
    status: "Published",
    $or: [
      { courseName: { $regex: escapedQuery, $options: "i" } },
      { tag: { $regex: escapedQuery, $options: "i" } },
      { courseDescription: { $regex: escapedQuery, $options: "i" } },
    ],
  })
    .select(COURSE_CARD_SELECT)
    .populate({ path: "instructor", select: "firstName lastName" })
    .populate("ratingAndReviews")
    .exec()

  return courses.slice(0, limit).map((course) => ({
    course: removeEmbedding(course),
    score: null,
  }))
}

exports.semanticSearch = async (req, res) => {
  const validation = semanticSearchSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid semantic search input",
      errors: validation.error.flatten().fieldErrors,
    })
  }

  const { query, limit } = validation.data
  const normalizedQuery = query.toLowerCase()

  try {
    const queryEmbedding = await getCachedQueryEmbedding(normalizedQuery)
    const courses = await populateCourseCardFields(
      Course.find({ status: "Published" })
    ).exec()
    const minimumScore = getMinimumScore()

    const results = courses
      .filter((course) => Array.isArray(course.embedding))
      .map((course) => ({
        course: removeEmbedding(course),
        score: cosineSimilarity(queryEmbedding, course.embedding),
      }))
      .filter((result) => result.score >= minimumScore)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)

    return res.status(200).json({ success: true, data: results })
  } catch (error) {
    console.error("Semantic search provider failed:", error.message)

    try {
      const results = await keywordFallback(query, limit)
      return res.status(200).json({ success: true, data: results, fallback: true })
    } catch (fallbackError) {
      console.error("Semantic search fallback failed:", fallbackError.message)
      return res.status(500).json({
        success: false,
        message: "Search is temporarily unavailable. Please try again.",
      })
    }
  }
}
