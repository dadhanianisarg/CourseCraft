const { instance } = require("../config/razorpay")
const Course = require("../models/Course")
const crypto = require("crypto")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const mongoose = require("mongoose")
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail")
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress")
const Payment = require("../models/Payment")

// Capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
  const { courses } = req.body
  const userId = req.user.id
  if (!Array.isArray(courses) || courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" })
  }

  const requestedCourses = [...new Set(courses.map(String))]
  let total_amount = 0

  for (const course_id of requestedCourses) {
    let course
    try {
      // Find the course by its ID
      course = await Course.findById(course_id)

      // If the course is not found, return an error
      if (!course) {
        return res
          .status(200)
          .json({ success: false, message: "Could not find the Course" })
      }

      // Check if the user is already enrolled in the course
      const uid = new mongoose.Types.ObjectId(userId)
      if (course.studentsEnrolled.includes(uid)) {
        return res
          .status(409)
          .json({ success: false, message: "Student is already Enrolled" })
      }

      // Add the price of the course to the total amount
      total_amount += course.price
    } catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }

  const sortedCourses = requestedCourses.sort()
  const pendingOrders = await Payment.find({
    userId,
    status: "created",
    createdAt: { $gte: new Date(Date.now() - 20 * 60 * 1000) },
  }).sort({ createdAt: -1 })
  const pendingOrder = pendingOrders.find(
    (order) =>
      order.courses.map(String).sort().join(",") === sortedCourses.join(",") &&
      order.amount === total_amount * 100
  )

  if (pendingOrder) {
    return res.json({
      success: true,
      data: {
        id: pendingOrder.razorpay_order_id,
        amount: pendingOrder.amount,
        currency: "INR",
        key_id: process.env.RAZORPAY_KEY,
      },
    })
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: req.idempotencyKey,
  }

  try {
    // Initiate the payment using Razorpay
    const paymentResponse = await instance.orders.create(options)
    await Payment.create({
      userId,
      courses: requestedCourses,
      amount: paymentResponse.amount,
      razorpay_order_id: paymentResponse.id,
      status: "created",
    })
    console.log(paymentResponse)
    res.json({
      success: true,
      data: {
        ...paymentResponse,
        key_id: process.env.RAZORPAY_KEY,
      },
    })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "Could not initiate order." })
  }
}

// verify the payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id
  const razorpay_payment_id = req.body?.razorpay_payment_id
  const razorpay_signature = req.body?.razorpay_signature
  const courses = req.body?.courses

  const userId = req.user.id

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "Payment Failed" })
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex")

  if (expectedSignature === razorpay_signature) {
    const existingPayment = await Payment.findOne({ razorpay_payment_id })
    if (existingPayment?.status === "paid") {
      return res.status(200).json({ success: true, message: "Payment Verified" })
    }

    let payment
    try {
      payment = await Payment.findOneAndUpdate(
        {
          userId,
          status: "created",
          $or: [
            { razorpay_order_id },
            { razorpay_payment_id },
          ],
        },
        {
          $set: {
            razorpay_payment_id,
            courses,
            status: "paid",
          },
        },
        { new: true }
      )
      if (!payment) {
        if (existingPayment?.status === "paid") {
          return res.status(200).json({ success: true, message: "Payment Verified" })
        }
        return res.status(400).json({ success: false, message: "Payment order not found" })
      }
    } catch (error) {
      if (error.code === 11000) {
        return res.status(200).json({ success: true, message: "Payment Verified" })
      }
      throw error
    }
    await enrollStudents(courses, userId)
    return res.status(200).json({ success: true, message: "Payment Verified" })
  }

  return res.status(200).json({ success: false, message: "Payment Failed" })
}

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body

  const userId = req.user.id

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details" })
  }

  try {
    const enrolledStudent = await User.findById(userId)

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    )
  } catch (error) {
    console.log("error in sending mail", error)
    return res
      .status(400)
      .json({ success: false, message: "Could not send email" })
  }
}

// enroll the student in the courses
const enrollStudents = async (courses, userId) => {
  if (!courses || !userId) {
    throw new Error("Please Provide Course ID and User ID")
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $addToSet: { studentsEnrolled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        throw new Error("Course not found")
      }
      console.log("Updated course: ", enrolledCourse)

      let courseProgress = await CourseProgress.findOne({
        courseID: courseId,
        userId,
      })
      if (!courseProgress) {
        try {
          courseProgress = await CourseProgress.create({
            courseID: courseId,
            userId: userId,
            completedVideos: [],
          })
        } catch (error) {
          if (error.code !== 11000) {
            throw error
          }
          courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId,
          })
        }
      }
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student: ", enrolledStudent)
      // Send an email notification to the enrolled student
      try {
        const emailResponse = await mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        )
        console.log("Email sent successfully: ", emailResponse.response)
      } catch (error) {
        console.log("Enrollment email failed:", error.message)
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}