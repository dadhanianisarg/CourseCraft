const assert = require("node:assert/strict")
const mongoose = require("mongoose")
require("dotenv").config()

const Course = require("../models/Course")
const User = require("../models/User")
const Payment = require("../models/Payment")
const razorpayConfig = require("../config/razorpay")
const { capturePayment } = require("../controllers/Payments")

const baseUrl = process.env.COURSECRAFT_API_URL
const token = process.env.COURSECRAFT_TEST_TOKEN
const orderId = process.env.COURSECRAFT_TEST_ORDER_ID
const paymentId = process.env.COURSECRAFT_TEST_PAYMENT_ID
const signature = process.env.COURSECRAFT_TEST_SIGNATURE
const courseId = process.env.COURSECRAFT_TEST_COURSE_ID
const secondCourseId = process.env.COURSECRAFT_TEST_COURSE_ID_2
const userId = process.env.COURSECRAFT_TEST_USER_ID

if (
  !baseUrl ||
  !token ||
  !orderId ||
  !paymentId ||
  !signature ||
  !courseId ||
  !secondCourseId ||
  !userId
) {
  throw new Error(
    "Set COURSECRAFT_API_URL, COURSECRAFT_TEST_TOKEN, COURSECRAFT_TEST_ORDER_ID, " +
      "COURSECRAFT_TEST_PAYMENT_ID, COURSECRAFT_TEST_SIGNATURE, " +
      "COURSECRAFT_TEST_COURSE_ID, COURSECRAFT_TEST_COURSE_ID_2, and " +
      "COURSECRAFT_TEST_USER_ID."
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

const capture = async (courses, key) => {
  let result
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      result = { status: this.statusCode, body }
      return this
    },
  }

  await capturePayment(
    {
      body: { courses },
      user: { id: userId },
      idempotencyKey: key,
    },
    res
  )
  return result
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URL)
  const originalCreateOrder = razorpayConfig.instance.orders.create
  let createdOrderNumber = 0
  razorpayConfig.instance.orders.create = async (options) => ({
    id: `test-order-${Date.now()}-${++createdOrderNumber}`,
    amount: options.amount,
    currency: options.currency,
    receipt: options.receipt,
  })

  const capturedOrderIds = []
  const captureKey = `capture-${Date.now()}`
  const firstCapture = await capture([courseId], captureKey)
  const secondCapture = await capture([courseId], `${captureKey}-retry`)
  capturedOrderIds.push(firstCapture.body.data.id, secondCapture.body.data.id)
  assert.equal(firstCapture.status, 200)
  assert.equal(secondCapture.status, 200)
  assert.equal(secondCapture.body.data.id, firstCapture.body.data.id)

  const differentCoursesCapture = await capture(
    [courseId, secondCourseId],
    `${captureKey}-different-courses`
  )
  capturedOrderIds.push(differentCoursesCapture.body.data.id)
  assert.notEqual(differentCoursesCapture.body.data.id, firstCapture.body.data.id)

  await Payment.updateOne(
    { razorpay_order_id: firstCapture.body.data.id },
    { createdAt: new Date(Date.now() - 21 * 60 * 1000) }
  )
  const expiredCapture = await capture([courseId], `${captureKey}-expired`)
  capturedOrderIds.push(expiredCapture.body.data.id)
  assert.notEqual(expiredCapture.body.data.id, firstCapture.body.data.id)

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

  const [course, user] = await Promise.all([
    Course.findById(courseId).select("studentsEnrolled"),
    User.findById(userId).select("courses"),
  ])
  assert.equal(
    course.studentsEnrolled.filter((id) => id.toString() === userId).length,
    1
  )
  assert.equal(user.courses.filter((id) => id.toString() === courseId).length, 1)
  await Payment.deleteMany({ razorpay_order_id: { $in: capturedOrderIds } })
  razorpayConfig.instance.orders.create = originalCreateOrder
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
