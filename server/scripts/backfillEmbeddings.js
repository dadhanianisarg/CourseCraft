// Run with: node server/scripts/backfillEmbeddings.js
// The script loads configuration from server/.env.

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const Course = require("../models/Course");
const { indexCourse } = require("../services/courseIndexer");

const COURSE_QUERY = { status: "Published" };
const COURSE_OPTIONS = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
};
const DELAY_MS = 1000;

const sleep = (milliseconds) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));

let shuttingDown = false;

const disconnect = async () => {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
};

const handleInterrupt = async () => {
	shuttingDown = true;
	console.log("\nStopping after the current course...");
	await disconnect();
	process.exitCode = 130;
};

process.once("SIGINT", () => {
	handleInterrupt().catch(() => {
		process.exitCode = 130;
	});
});

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

	await mongoose.connect(process.env.MONGODB_URL, COURSE_OPTIONS);
	const courses = await Course.find(COURSE_QUERY).select("_id").lean();
	const summary = { indexed: 0, skipped: 0, failed: 0 };

	for (let index = 0; index < courses.length && !shuttingDown; index += 1) {
		const result = await indexCourse(courses[index]._id);
		if (result === "indexed") {
			summary.indexed += 1;
		} else if (result === "failed") {
			summary.failed += 1;
		} else {
			summary.skipped += 1;
		}

		console.log(
			`${index + 1}/${courses.length} ${result === "skipped" ? "skipped (unchanged)" : result}`,
		);

		if (index + 1 < courses.length && !shuttingDown) {
			await sleep(DELAY_MS);
		}
	}

	console.log(
		`Summary: ${summary.indexed} indexed, ${summary.skipped} skipped (unchanged), ${summary.failed} failed`,
	);
	if (summary.failed > 0) {
		process.exitCode = 1;
	}
};

main()
	.catch((error) => {
		console.error(`Backfill failed: ${error.message}`);
		process.exitCode = 1;
	})
	.finally(disconnect);
