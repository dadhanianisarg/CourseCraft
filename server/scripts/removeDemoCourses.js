// Run with: node server/scripts/removeDemoCourses.js

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const database = require("../config/database");
const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");

const disconnect = async () => {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
};

const main = async () => {
	if (!process.env.MONGODB_URL) {
		throw new Error("MONGODB_URL is not configured in server/.env");
	}

	database.connect();
	await mongoose.connection.asPromise();

	const demoCourses = await Course.find({ tag: "demo-seed" })
		.select("_id instructor category courseName")
		.lean();
	if (!demoCourses.length) {
		console.log("No demo-seed courses found.");
		return;
	}

	const courseIds = demoCourses.map((course) => course._id);
	const instructorIds = [
		...new Set(demoCourses.map((course) => String(course.instructor))),
	];
	const categoryIds = [
		...new Set(
			demoCourses
				.filter((course) => course.category)
				.map((course) => String(course.category)),
		),
	];

	const deleted = await Course.deleteMany({ _id: { $in: courseIds } });
	await User.updateMany(
		{ _id: { $in: instructorIds } },
		{ $pull: { courses: { $in: courseIds } } },
	);
	await Category.updateMany(
		{ _id: { $in: categoryIds } },
		{ $pull: { courses: { $in: courseIds } } },
	);

	console.log(`Removed ${deleted.deletedCount} demo-seed courses.`);
	console.log(`Updated ${instructorIds.length} instructor reference(s) and ${categoryIds.length} category reference(s).`);
};

main()
	.catch((error) => {
		console.error(`Demo course removal failed: ${error.message}`);
		process.exitCode = 1;
	})
	.finally(disconnect);
