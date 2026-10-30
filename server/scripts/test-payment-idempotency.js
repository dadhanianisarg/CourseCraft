const assert = require("node:assert/strict")
const mongoose = require("mongoose")
require("dotenv").config()

const Course = require("../models/Course")
const User = require("../models/User")

const baseUrl = process.env.COURSECRAFT_API_URL
const token = process.env.COURSECRAFT_TEST_TOKEN
const orderId = process.env.COURSECRAFT_TEST_ORDER_ID
const paymentId = process.env.COURSECRAFT_TEST_PAYMENT_ID
const signature = process.env.COURSECRAFT_TEST_SIGNATURE
const courseId = process.env.COURSECRAFT_TEST_COURSE_ID
const userId = process.env.COURSECRAFT_TEST_USER_ID

if (!baseUrl || !token || !orderId || !paymentId || !signature || !courseId || !userId) {
  throw new Error(
    "Set COURSECRAFT_API_URL, COURSECRAFT_TEST_TOKEN, COURSECRAFT_TEST_ORDER_ID, " +
      "COURSECRAFT_TEST_PAYMENT_ID, COURSECRAFT_TEST_SIGNATURE, " +
      "COURSECRAFT_TEST_COURSE_ID, and COURSECRAFT_TEST_USER_ID."
  )
}

const body = {
  razorpay_order_id: orderId,
  razorpay_payment_id: paymentId,
  razorpay_signature: signature,
  courses: [courseId],
}

const verify = (requestBody, key) =>
  fetch(`${baseUrl}/api/v1/payment/verifyPayment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify(requestBody),
  }).then(async (response) => ({
    status: response.status,
    body: await response.json(),
  }))

const run = async () => {
  const firstKey = `payment-idempotency-${Date.now()}`
  const first = await verify(body, firstKey)
  const replay = await verify(body, firstKey)
  assert.equal(first.status, 200)
  assert.deepEqual(replay, first)

  const simultaneousKey = `${firstKey}-simultaneous`
  const simultaneous = await Promise.all([
    verify(body, simultaneousKey),
    verify(body, simultaneousKey),
  ])
  assert(
    simultaneous.every((result) => result.status === 200 || result.status === 409),
    "Concurrent requests must succeed, replay, or report in-progress"
  )

  const differentRequest = await verify(
    { ...body, courses: [courseId, "different-course-request"] },
    firstKey
  )
  assert.equal(differentRequest.status, 422)

  await mongoose.connect(process.env.MONGODB_URL)
  const [course, user] = await Promise.all([
    Course.findById(courseId).select("studentsEnrolled"),
    User.findById(userId).select("courses"),
  ])
  assert.equal(
    course.studentsEnrolled.filter((id) => id.toString() === userId).length,
    1
  )
  assert.equal(user.courses.filter((id) => id.toString() === courseId).length, 1)
  await mongoose.disconnect()
  console.log("Payment idempotency test passed.")
}

run().catch(async (error) => {
  console.error(error)
  if (mongoose.connection.readyState) {
    await mongoose.disconnect()
  }
  process.exitCode = 1
})
