// Run with: node server/scripts/evalSearch.js
// The script loads configuration from server/.env.

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Course = require("../models/Course");
const { embedQuery, cosineSimilarity } = require("../services/embeddings");

const DELAY_MS = 1000;
const TOP_K = 3;
const MIN_SCORE = Number(process.env.SEMANTIC_MIN_SCORE || 0.5);
const MONGOOSE_OPTIONS = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
};

const TEST_CASES = [
	{ query: "make websites talk to databases", expectedTitles: ["Production MongoDB and REST API Project"] },
	{ query: "protect a Node backend with login tokens", expectedTitles: ["Node.js Authentication with JWT"] },
	{ query: "design data models for a document database", expectedTitles: ["MongoDB Data Modeling for Applications"] },
	{ query: "create mobile-friendly user interfaces", expectedTitles: ["Tailwind CSS Responsive Interfaces"] },
	{ query: "automate builds tests and deployments", expectedTitles: ["CI/CD Pipelines with GitHub Actions"] },
	{ query: "run containerized services in a cluster", expectedTitles: ["Kubernetes Essentials"] },
	{ query: "prepare for algorithm interviews with sequences", expectedTitles: ["Arrays and Strings for Coding Interviews"] },
	{ query: "solve problems by remembering smaller answers", expectedTitles: ["Dynamic Programming Problem Solving"] },
	{ query: "teach a computer to find patterns in data", expectedTitles: ["Introduction to Machine Learning"] },
	{ query: "learn to cook pasta and sauces at home", expectedTitles: ["Italian Cooking from Scratch"] },
	{ query: "React hooks", expectedTitles: ["React Hooks and State Management"] },
	{ query: "Docker", expectedTitles: ["Docker for Developers"] },
	{ query: "JavaScript", expectedTitles: ["JavaScript Fundamentals for Web Developers"] },
	{ query: "AWS", expectedTitles: ["AWS Cloud Basics for Beginners"] },
	{ query: "Python", expectedTitles: ["Python Programming Basics"] },
	{ query: "I want to start programming", expectedTitles: ["JavaScript Fundamentals for Web Developers"] },
	{ query: "I am a beginner who wants to learn technology", expectedTitles: ["Python Programming Basics"] },
	{ query: "quantum physics", expectedTitles: [] },
	{ query: "stock trading", expectedTitles: [] },
	{ query: "professional basketball coaching", expectedTitles: [] },
];

const sleep = (milliseconds) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeTitle = (title) => title.trim().toLowerCase();

const hasExpectedTitle = (courses, expectedTitles) => {
	const expected = new Set(expectedTitles.map(normalizeTitle));
	return courses
		.slice(0, TOP_K)
		.some((course) => expected.has(normalizeTitle(course.courseName)));
};

const getKeywordCourses = async (query, courses) => {
	const expression = new RegExp(escapeRegExp(query), "i");
	return courses.filter((course) =>
		[course.courseName, course.tag, course.courseDescription].some((field) =>
			Array.isArray(field)
				? field.some((value) => typeof value === "string" && expression.test(value))
				: typeof field === "string" && expression.test(field),
		),
	);
};

const evaluateSemantic = async (query, courses) => {
	const queryEmbedding = await embedQuery(query);
	return courses
		.filter((course) => Array.isArray(course.embedding))
		.map((course) => ({
			course,
			score: cosineSimilarity(queryEmbedding, course.embedding),
		}))
		.filter((result) => result.score >= MIN_SCORE)
		.sort((left, right) => right.score - left.score)
		.map((result) => result.course);
};

const disconnect = async () => {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
};

const main = async () => {
	const missingVariables = ["MONGODB_URL", "GEMINI_API_KEY"].filter(
		(variable) => !process.env[variable],
	);
	if (missingVariables.length) {
		console.error(
			`Missing required environment variables: ${missingVariables.join(", ")}`,
		);
		process.exitCode = 1;
		return;
	}

	await mongoose.connect(process.env.MONGODB_URL, MONGOOSE_OPTIONS);
	const courses = await Course.find({ status: "Published" })
		.select("courseName courseDescription tag +embedding")
		.lean()
		.exec();
	const totals = { semantic: 0, keyword: 0 };
	const outcomes = [];

	for (let index = 0; index < TEST_CASES.length; index += 1) {
		const testCase = TEST_CASES[index];
		const semanticCourses = await evaluateSemantic(testCase.query, courses);
		const keywordCourses = await getKeywordCourses(testCase.query, courses);
		const semanticHit = hasExpectedTitle(semanticCourses, testCase.expectedTitles);
		const keywordHit = hasExpectedTitle(keywordCourses, testCase.expectedTitles);

		if (semanticHit) totals.semantic += 1;
		if (keywordHit) totals.keyword += 1;
		outcomes.push({
			query: testCase.query,
			semanticHit,
			keywordHit,
			expectedNoMatch: testCase.expectedTitles.length === 0,
			semanticReturnedNothing: semanticCourses.length === 0,
			keywordReturnedNothing: keywordCourses.length === 0,
		});

		console.log(
			`${index + 1}/${TEST_CASES.length} ${testCase.query} | semantic hit@3: ${semanticHit ? "yes" : "no"} | keyword hit@3: ${keywordHit ? "yes" : "no"}`,
		);

		if (index + 1 < TEST_CASES.length) {
			await sleep(DELAY_MS);
		}
	}

	const matchingCases = TEST_CASES.filter((testCase) => testCase.expectedTitles.length > 0).length;
	const percentage = (hits) => ((hits / matchingCases) * 100).toFixed(1);
	console.log(`\nSemantic hit@3: ${totals.semantic}/${matchingCases} (${percentage(totals.semantic)}%)`);
	console.log(`Keyword hit@3: ${totals.keyword}/${matchingCases} (${percentage(totals.keyword)}%)`);
	console.log("\nSemantic won:");
	console.log(outcomes.filter((result) => result.semanticHit && !result.keywordHit).map((result) => result.query));
	console.log("Keyword won:");
	console.log(outcomes.filter((result) => result.keywordHit && !result.semanticHit).map((result) => result.query));
	console.log("Both failed:");
	console.log(outcomes.filter((result) => !result.semanticHit && !result.keywordHit).map((result) => result.query));
	console.log("\nNo-match queries correctly returned nothing (semantic):");
	console.log(
		outcomes
			.filter((result) => result.expectedNoMatch && result.semanticReturnedNothing)
			.map((result) => result.query),
	);
	console.log("No-match queries returned junk (semantic):");
	console.log(
		outcomes
			.filter((result) => result.expectedNoMatch && !result.semanticReturnedNothing)
			.map((result) => result.query),
	);
	console.log("No-match queries correctly returned nothing (keyword):");
	console.log(
		outcomes
			.filter((result) => result.expectedNoMatch && result.keywordReturnedNothing)
			.map((result) => result.query),
	);
	console.log("No-match queries returned junk (keyword):");
	console.log(
		outcomes
			.filter((result) => result.expectedNoMatch && !result.keywordReturnedNothing)
			.map((result) => result.query),
	);
};

main()
	.catch((error) => {
		console.error(`Search evaluation failed: ${error.message}`);
		process.exitCode = 1;
	})
	.finally(disconnect);
