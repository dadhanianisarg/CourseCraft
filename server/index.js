const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");
const aiRoutes = require("./routes/AI");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const { isVersionConflict, sendVersionConflict } = require("./utils/concurrency");
const IdempotencyKey = require("./models/IdempotencyKey");

dotenv.config();
const PORT = process.env.PORT || 4000;
app.set("trust proxy", 1);

//database connect
database.connect();
//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"https://course-craft-frontend-xi.vercel.app",
			"https://course-craft-frontend-j8n2kx9o7-nisarg-dadhanias-projects.vercel.app",
		],
		credentials: true,
	})
);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp",
	})
)
//cloudinary connection
cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);
app.use("/api/v1/ai", aiRoutes);

app.use((error, req, res, next) => {
	if (req.idempotencyRecord) {
		IdempotencyKey.findByIdAndDelete(req.idempotencyRecord._id).catch((cleanupError) => {
			console.error("Could not clear idempotency record:", cleanupError);
		});
	}
	if (isVersionConflict(error)) {
		return sendVersionConflict(res);
	}
	next(error);
});

//def route

app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: 'Your server is up and running....'
	});
});

app.listen(PORT, () => {
	console.log(`App is running at ${PORT}`)
})
