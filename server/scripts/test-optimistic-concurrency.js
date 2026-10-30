const assert = require("node:assert/strict");
const mongoose = require("mongoose");
require("dotenv").config();
const Course = require("../models/Course");

const uri =
	process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!uri) {
	throw new Error(
		"Set MONGODB_URL, MONGODB_URI, or DATABASE_URL before running this test."
	);
}

const run = async () => {
	await mongoose.connect(uri);
	const course = await Course.create({
		courseName: `OCC test ${Date.now()}`,
		instructor: new mongoose.Types.ObjectId(),
		tag: ["test"],
	});

	try {
		const first = await Course.findById(course._id);
		const second = await Course.findById(course._id);
		first.courseName = "first update";
		second.courseName = "second update";

		const results = await Promise.allSettled([first.save(), second.save()]);
		assert.equal(
			results.filter((result) => result.status === "fulfilled").length,
			1,
			"Exactly one concurrent update should succeed"
		);
		assert.equal(
			results.filter(
				(result) =>
					result.status === "rejected" && result.reason.name === "VersionError"
			).length,
			1,
			"The stale concurrent update should fail with VersionError"
		);
		console.log("Optimistic concurrency test passed.");
	} finally {
		await Course.deleteOne({ _id: course._id });
		await mongoose.disconnect();
	}
};

run().catch(async (error) => {
	console.error(error);
	await mongoose.disconnect();
	process.exitCode = 1;
});
