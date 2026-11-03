const { z } = require("zod")

const courseDraftInputSchema = z.object({
  title: z.string().trim().min(5).max(100),
  category: z.string().trim().max(50).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  keyPoints: z.string().trim().max(500).optional(),
  description: z.string().trim().max(800).optional(),
  tags: z.string().trim().max(500).optional(),
  benefits: z.string().trim().max(1000).optional(),
  requirements: z.string().trim().max(1000).optional(),
})

const subsectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

const courseDraftOutputSchema = z.object({
  description: z.string().min(50).max(800),
  tags: z.array(z.string().min(1)).min(3).max(6),
  whatYouWillLearn: z.string().max(1000),
  requirements: z.array(z.string()).max(8),
  outline: z
    .array(
      z.object({
        sectionName: z.string().min(1),
        subsections: z.array(subsectionSchema).min(2).max(8),
      })
    )
    .min(3)
    .max(10),
})

// Zod remains the source of truth for runtime validation; keep this schema in sync for Gemini JSON mode.
const courseDraftOutputJsonSchema = {
  type: "object",
  properties: {
    description: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    whatYouWillLearn: { type: "string" },
    requirements: { type: "array", items: { type: "string" } },
    outline: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sectionName: { type: "string" },
          subsections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
              },
              required: ["title", "description"],
            },
          },
        },
        required: ["sectionName", "subsections"],
      },
    },
  },
  required: [
    "description",
    "tags",
    "whatYouWillLearn",
    "requirements",
    "outline",
  ],
}

module.exports = {
  courseDraftInputSchema,
  courseDraftOutputSchema,
  courseDraftOutputJsonSchema,
}
