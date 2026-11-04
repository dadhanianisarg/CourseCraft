// Run with: node server/scripts/seedDemoCourses.js

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const database = require("../config/database");
const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");

const THUMBNAIL_URL = "https://placehold.co/800x450/png?text=CourseCraft";

const DEMO_COURSES = [
	{
		courseName: "Building REST APIs with Express and Node.js",
		courseDescription: "Learn to design and build production-ready REST APIs with Node.js and Express. You will create a maintainable backend with validation, middleware, error handling, and practical API documentation.",
		whatYouWillLearn: "Express routing, middleware, REST conventions, validation, error handling, API documentation",
		tag: ["Node.js", "Express", "REST APIs", "demo-seed"],
		category: "Web Development",
		price: 1299,
	},
	{
		courseName: "Node.js Authentication with JWT",
		courseDescription: "Build secure authentication flows for modern Node.js applications. This course covers password hashing, JWT access tokens, protected routes, and common security considerations.",
		whatYouWillLearn: "JWT authentication, bcrypt password hashing, authorization middleware, secure sessions",
		tag: ["Node.js", "JWT", "Authentication", "demo-seed"],
		category: "Cybersecurity",
		price: 1499,
	},
	{
		courseName: "MongoDB Data Modeling for Applications",
		courseDescription: "Learn how to model application data with MongoDB and Mongoose. You will work with schemas, relationships, indexes, validation, and query patterns that scale with your application.",
		whatYouWillLearn: "MongoDB schemas, Mongoose models, references, indexes, validation",
		tag: ["MongoDB", "Mongoose", "Database", "demo-seed"],
		category: "Database Management",
		price: 1199,
	},
	{
		courseName: "Production MongoDB and REST API Project",
		courseDescription: "Combine MongoDB, Express, and Node.js to build a complete backend project. Practice pagination, filtering, structured errors, and deployment-ready configuration through realistic features.",
		whatYouWillLearn: "Full backend architecture, pagination, filtering, error handling, deployment configuration",
		tag: ["MongoDB", "Express", "Backend", "demo-seed"],
		category: "Database Management",
		price: 1799,
	},
	{
		courseName: "React Hooks and State Management",
		courseDescription: "Understand React hooks by building interactive components and data-driven interfaces. Learn how to organize local and shared state without making components difficult to maintain.",
		whatYouWillLearn: "useState, useEffect, custom hooks, context, shared state patterns",
		tag: ["React", "Hooks", "State Management", "demo-seed"],
		category: "Web Development",
		price: 1399,
	},
	{
		courseName: "Tailwind CSS Responsive Interfaces",
		courseDescription: "Create polished responsive interfaces with Tailwind CSS and reusable layout patterns. You will build accessible pages that adapt cleanly across mobile, tablet, and desktop screens.",
		whatYouWillLearn: "Tailwind utilities, responsive design, layouts, reusable UI patterns, accessibility",
		tag: ["Tailwind CSS", "Frontend", "Responsive Design", "demo-seed"],
		category: "Web Development",
		price: 999,
	},
	{
		courseName: "JavaScript Fundamentals for Web Developers",
		courseDescription: "Build a strong JavaScript foundation for frontend and backend development. Work through functions, objects, arrays, asynchronous code, modules, and browser fundamentals with practical exercises.",
		whatYouWillLearn: "JavaScript syntax, functions, arrays, objects, promises, modules",
		tag: ["JavaScript", "Web Development", "Programming", "demo-seed"],
		category: "Programming Languages",
		price: 1099,
	},
	{
		courseName: "Docker for Developers",
		courseDescription: "Learn how containers simplify development and deployment workflows. Build images, run multi-container applications, manage volumes and networks, and write practical Dockerfiles.",
		whatYouWillLearn: "Docker images, containers, Dockerfiles, volumes, networks, Compose",
		tag: ["Docker", "Containers", "DevOps", "demo-seed"],
		category: "DevOps",
		price: 1299,
	},
	{
		courseName: "Kubernetes Essentials",
		courseDescription: "Explore the core Kubernetes concepts used to run containerized applications. Deploy services, configure workloads, inspect cluster behavior, and understand scaling and health checks.",
		whatYouWillLearn: "Pods, deployments, services, config maps, scaling, health checks",
		tag: ["Kubernetes", "Containers", "DevOps", "demo-seed"],
		category: "DevOps",
		price: 1599,
	},
	{
		courseName: "CI/CD Pipelines with GitHub Actions",
		courseDescription: "Automate testing and deployment with practical CI/CD pipelines. You will create workflows that validate code, build artifacts, manage secrets safely, and deploy reliably.",
		whatYouWillLearn: "GitHub Actions, automated tests, build workflows, deployment pipelines, secrets",
		tag: ["CI/CD", "GitHub Actions", "DevOps", "demo-seed"],
		category: "DevOps",
		price: 1399,
	},
	{
		courseName: "AWS Cloud Basics for Beginners",
		courseDescription: "Get a practical introduction to the AWS services most commonly used by application teams. Learn core cloud concepts, hosting options, storage, networking basics, and cost awareness.",
		whatYouWillLearn: "AWS compute, storage, networking, IAM basics, cloud deployment concepts",
		tag: ["AWS", "Cloud", "DevOps", "demo-seed"],
		category: "Cloud Computing",
		price: 1499,
	},
	{
		courseName: "Arrays and Strings for Coding Interviews",
		courseDescription: "Master the patterns behind common array and string interview problems. Practice two pointers, sliding windows, prefix sums, hashing, and complexity analysis through guided solutions.",
		whatYouWillLearn: "Array patterns, string algorithms, sliding window, hashing, Big O analysis",
		tag: ["DSA", "Arrays", "Coding Interviews", "demo-seed"],
		category: "Programming Languages",
		price: 1199,
	},
	{
		courseName: "Graphs and Trees in Data Structures",
		courseDescription: "Learn to represent and solve problems involving trees and graphs. Implement traversals, shortest paths, connectivity checks, and common interview problem strategies.",
		whatYouWillLearn: "BFS, DFS, trees, graph representations, shortest paths, connectivity",
		tag: ["DSA", "Graphs", "Trees", "demo-seed"],
		category: "Programming Languages",
		price: 1399,
	},
	{
		courseName: "Dynamic Programming Problem Solving",
		courseDescription: "Develop a repeatable approach to dynamic programming problems instead of memorizing solutions. Learn state design, transitions, memoization, tabulation, and space optimization.",
		whatYouWillLearn: "DP states, recurrence relations, memoization, tabulation, optimization",
		tag: ["DSA", "Dynamic Programming", "Algorithms", "demo-seed"],
		category: "Programming Languages",
		price: 1499,
	},
	{
		courseName: "Python Programming Basics",
		courseDescription: "Learn Python from the ground up through small, useful programs. Cover syntax, collections, functions, files, exceptions, and the habits needed for data and automation work.",
		whatYouWillLearn: "Python syntax, collections, functions, files, exceptions, modules",
		tag: ["Python", "Programming", "Data", "demo-seed"],
		category: "Programming Languages",
		price: 999,
	},
	{
		courseName: "Introduction to Machine Learning",
		courseDescription: "Understand the fundamental ideas behind supervised and unsupervised machine learning. Build simple models, evaluate results, and learn how data preparation affects real-world performance.",
		whatYouWillLearn: "Regression, classification, clustering, evaluation, feature preparation",
		tag: ["Machine Learning", "Python", "AI", "demo-seed"],
		category: "AI/ML",
		price: 1699,
	},
	{
		courseName: "SQL Queries and Relational Data",
		courseDescription: "Learn to retrieve and analyze relational data with SQL. Practice filtering, joins, grouping, subqueries, and useful reporting queries using realistic datasets.",
		whatYouWillLearn: "SELECT queries, joins, aggregation, subqueries, relational modeling",
		tag: ["SQL", "Database", "Data", "demo-seed"],
		category: "Database Management",
		price: 1099,
	},
	{
		courseName: "Italian Cooking from Scratch",
		courseDescription: "Prepare approachable Italian dishes while learning the techniques behind fresh pasta, sauces, and balanced flavors. The lessons focus on repeatable methods for confident home cooking.",
		whatYouWillLearn: "Fresh pasta, sauces, seasoning, ingredient preparation, plating",
		tag: ["Cooking", "Italian Food", "demo-seed"],
		category: "UI/UX Design",
		price: 899,
	},
	{
		courseName: "Beginner Guitar Chords and Rhythm",
		courseDescription: "Start playing guitar with a practical collection of beginner chords and rhythm patterns. Build comfort with chord changes, strumming, tuning, and simple song practice.",
		whatYouWillLearn: "Guitar tuning, open chords, chord changes, strumming, rhythm practice",
		tag: ["Guitar", "Music", "Beginner", "demo-seed"],
		category: "UI/UX Design",
		price: 799,
	},
	{
		courseName: "Photography Composition Basics",
		courseDescription: "Learn how to make stronger photographs with composition, light, and intentional framing. The course uses practical exercises that work with a phone or a dedicated camera.",
		whatYouWillLearn: "Composition, lighting, framing, exposure basics, visual storytelling",
		tag: ["Photography", "Creative", "Beginner", "demo-seed"],
		category: "UI/UX Design",
		price: 999,
	},
];

const disconnect = async () => {
	if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
	}
};

const main = async () => {
	if (!process.env.MONGODB_URL) {
		throw new Error("MONGODB_URL is not configured in server/.env");
	}
	if (!process.env.SEED_INSTRUCTOR_EMAIL) {
		throw new Error("SEED_INSTRUCTOR_EMAIL is not configured in server/.env");
	}

	database.connect();
	await mongoose.connection.asPromise();

	const instructor = await User.findOne({
		email: process.env.SEED_INSTRUCTOR_EMAIL.trim(),
	});
	if (!instructor) {
		throw new Error(`No user found for SEED_INSTRUCTOR_EMAIL: ${process.env.SEED_INSTRUCTOR_EMAIL}`);
	}
	if (instructor.accountType !== "Instructor") {
		throw new Error(`SEED_INSTRUCTOR_EMAIL belongs to a ${instructor.accountType}, not an Instructor`);
	}

	console.log(`Using instructor ${instructor.email}`);
	const categories = await Category.find({}).select("_id name").lean();
	if (!categories.length) {
		throw new Error("No categories found. Run server/seedCategories.js first.");
	}

	console.log("Categories found:", categories.map((category) => category.name).join(", "));
	const categoriesByName = new Map(
		categories.map((category) => [
			category.name.trim().toLowerCase(),
			category,
		]),
	);
	const fallbackCategory = categories[0];
	const existingCourseNames = new Set(
		(
			await Course.find({
				courseName: { $in: DEMO_COURSES.map((course) => course.courseName) },
			})
				.select("courseName")
				.lean()
		).map((course) => course.courseName),
	);
	const coursesToInsert = [];
	let created = 0;
	let skipped = 0;

	for (const definition of DEMO_COURSES) {
		if (existingCourseNames.has(definition.courseName)) {
			skipped += 1;
			console.log(`Skipped: ${definition.courseName} (already exists)`);
			continue;
		}

		let category = categoriesByName.get(definition.category.trim().toLowerCase());
		if (!category) {
			category = fallbackCategory;
			console.warn(
				`Warning: "${definition.courseName}" requested category "${definition.category}", using fallback "${category.name}".`,
			);
		}

		const course = new Course({
			...definition,
			category: category._id,
			instructor: instructor._id,
			thumbnail: THUMBNAIL_URL,
			status: "Published",
			instructions: ["Complete the lessons and practice the included exercises."],
		});
		coursesToInsert.push({ course, category });
	}

	for (const { course } of coursesToInsert) {
		await course.validate();
	}
	console.log(`Validated ${coursesToInsert.length} course(s); beginning inserts...`);

	for (const { course, category } of coursesToInsert) {
		await course.save();
		await User.updateOne(
			{ _id: instructor._id },
			{ $addToSet: { courses: course._id } },
		);
		await Category.updateOne(
			{ _id: category._id },
			{ $addToSet: { courses: course._id } },
		);

		created += 1;
		console.log(`Created ${created}: ${course.courseName} [${category.name}]`);
	}

	console.log(`Finished: ${created} created, ${skipped} skipped`);
};

main()
	.catch((error) => {
		console.error(`Demo course seeding failed: ${error.message}`);
		process.exitCode = 1;
	})
	.finally(disconnect);
