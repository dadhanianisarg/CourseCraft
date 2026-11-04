const { z } = require("zod")

const semanticSearchSchema = z.object({
  query: z.string().trim().min(2).max(200),
  limit: z.number().int().min(1).max(20).default(8),
})

module.exports = { semanticSearchSchema }
