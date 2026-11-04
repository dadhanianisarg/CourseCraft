const crypto = require("crypto");

const Course = require("../models/Course");
require("../models/Category");
const { embedDocuments } = require("./embeddings");
const { buildCourseEmbeddingText } = require("../utils/courseEmbeddingText");

const EMBEDDING_MODEL =
	process.env.EMBEDDING_MODEL || "gemini-embedding-001";

const indexCourse = async (courseId) => {
	try {
		const course = await Course.findById(courseId)
			.select("+embeddingHash +embeddingModel")
			.populate({ path: "category", select: "name" })
			.exec();

		if (!course || course.status !== "Published") {
			return "skipped";
		}

		const text = buildCourseEmbeddingText(course);
		const embeddingHash = crypto
			.createHash("sha256")
			.update(text)
			.digest("hex");

		if (
			course.embeddingHash === embeddingHash &&
			course.embeddingModel === EMBEDDING_MODEL
		) {
			return "skipped";
		}

		const [embedding] = await embedDocuments([
			{ title: course.courseName, text },
		]);

		await Course.updateOne(
			{ _id: courseId },
			{
				$set: {
					embedding,
					embeddingHash,
					embeddingModel: EMBEDDING_MODEL,
					embeddingUpdatedAt: new Date(),
				},
			},
		);
		return "indexed";
	} catch (error) {
		console.error("Course indexing failed:", error.message);
		return "failed";
	}
};

module.exports = { indexCourse };
