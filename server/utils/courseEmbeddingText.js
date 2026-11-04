const normalizeField = (value) => {
	if (Array.isArray(value)) {
		return value
			.filter((item) => typeof item === "string")
			.join(", ")
			.trim();
	}

	return typeof value === "string" ? value.trim() : "";
};

const buildCourseEmbeddingText = (course) => {
	const categoryName =
		course.category && typeof course.category === "object"
			? course.category.name
			: course.category;
	const fields = [
		["Title", course.courseName],
		["Description", course.courseDescription],
		["Tags", course.tag],
		["Category", categoryName],
		["What you will learn", course.whatYouWillLearn],
	];

	return fields
		.map(([label, value]) => `${label}: ${normalizeField(value)}`)
		.filter((field) => field.split(": ").slice(1).join(": ").length > 0)
		.join("\n")
		.slice(0, 6000);
};

module.exports = { buildCourseEmbeddingText };
