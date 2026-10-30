const crypto = require("crypto")
const IdempotencyKey = require("../models/IdempotencyKey")

const PROCESSING_TIMEOUT_MS = 2 * 60 * 1000

const requestHash = (body) =>
  crypto.createHash("sha256").update(JSON.stringify(body || {})).digest("hex")

const idempotency = async (req, res, next) => {
  const key = req.get("Idempotency-Key")
  if (!key) {
    return res.status(400).json({
      success: false,
      message: "Idempotency-Key header is required",
    })
  }

  const endpoint = `${req.baseUrl}${req.path}`
  const hash = requestHash(req.body)
  req.idempotencyKey = key
  let record

  try {
    record = await IdempotencyKey.create({
      key,
      userId: req.user.id,
      endpoint,
      requestHash: hash,
      status: "processing",
    })
  } catch (error) {
    if (error.code !== 11000) {
      return next(error)
    }

    record = await IdempotencyKey.findOne({
      userId: req.user.id,
      key,
      endpoint,
    })
    if (!record) {
      return next(error)
    }
    if (record.requestHash !== hash) {
      return res.status(422).json({
        success: false,
        message: "Idempotency key reused with a different request",
      })
    }
    if (record.status === "completed") {
      return res.status(record.responseStatus).json(record.responseBody)
    }

    if (record.createdAt.getTime() <= Date.now() - PROCESSING_TIMEOUT_MS) {
      const takeover = await IdempotencyKey.findOneAndUpdate(
        {
          _id: record._id,
          status: "processing",
          createdAt: { $lte: new Date(Date.now() - PROCESSING_TIMEOUT_MS) },
        },
        { createdAt: new Date() },
        { new: true }
      )
      if (takeover) {
        record = takeover
      } else {
        return res.status(409).json({
          success: false,
          message: "A request with this key is already in progress",
        })
      }
    } else {
      return res.status(409).json({
        success: false,
        message: "A request with this key is already in progress",
      })
    }
  }

  req.idempotencyRecord = record
  let responseBody
  const originalJson = res.json.bind(res)
  const originalSend = res.send.bind(res)
  let sendingJson = false

  const saveResponse = async (body) => {
    responseBody = body
    if (res.statusCode >= 200 && res.statusCode < 300) {
      await IdempotencyKey.findByIdAndUpdate(record._id, {
        status: "completed",
        responseStatus: res.statusCode,
        responseBody,
      })
    } else {
      await IdempotencyKey.findByIdAndDelete(record._id)
    }
  }

  res.json = (body) => {
    sendingJson = true
    saveResponse(body).catch(next)
    const result = originalJson(body)
    sendingJson = false
    return result
  }
  res.send = (body) => {
    if (!sendingJson) {
      saveResponse(body).catch(next)
    }
    return originalSend(body)
  }

  return next()
}

module.exports = idempotency
