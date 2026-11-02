// Run with:
// BASE_URL=https://your-backend.onrender.com INSTRUCTOR_EMAIL=... INSTRUCTOR_PASSWORD=... STUDENT_EMAIL=... STUDENT_PASSWORD=... node server/scripts/testAiLive.js

const requiredEnvironmentVariables = [
  "BASE_URL",
  "INSTRUCTOR_EMAIL",
  "INSTRUCTOR_PASSWORD",
  "STUDENT_EMAIL",
  "STUDENT_PASSWORD",
]

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name]
)

if (missingEnvironmentVariables.length > 0) {
  console.error(
    `Missing environment variables: ${missingEnvironmentVariables.join(", ")}`
  )
  process.exit(1)
}

const baseUrl = process.env.BASE_URL.replace(/\/+$/, "")
const requestTimeoutMs = 15000

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

const parseResponse = async (response) => {
  const text = await response.text()

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return {}
  }
}

const wakeServer = async () => {
  const deadline = Date.now() + 90000

  while (Date.now() < deadline) {
    console.log("waking server...")

    try {
      const response = await fetchWithTimeout(baseUrl)
      if (response.status < 500) {
        return true
      }
    } catch {
      // Render may still be starting or the request may have timed out.
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  return false
}

const login = async (email, password) => {
  const response = await fetchWithTimeout(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
  const body = await parseResponse(response)

  if (!response.ok || !body.token) {
    throw new Error(`Login failed with status ${response.status}`)
  }

  return body.token
}

const runTest = async (name, expectedStatus, options, validateBody) => {
  const startedAt = Date.now()
  let response
  let body = {}
  let failureReason = ""

  try {
    response = await fetchWithTimeout(`${baseUrl}/api/v1/ai/course-draft`, options)
    body = await parseResponse(response)

    if (response.status !== expectedStatus) {
      failureReason = `expected ${expectedStatus}, received ${response.status}`
    } else if (validateBody && !validateBody(body)) {
      failureReason = "response body did not match the expected shape"
    }
  } catch (error) {
    failureReason = error.name === "AbortError" ? "request timed out" : "request failed"
  }

  const elapsedMs = Date.now() - startedAt
  const passed = !failureReason
  console.log(
    `${passed ? "PASS" : "FAIL"} ${name} - status ${
      response?.status || "error"
    } - ${elapsedMs}ms${failureReason ? ` (${failureReason})` : ""}`
  )

  return { passed, body }
}

const buildRequest = (token, body) => ({
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(body),
})

const main = async () => {
  if (!(await wakeServer())) {
    console.error("The backend did not wake within 90 seconds.")
    process.exitCode = 1
    return
  }

  let instructorToken
  let studentToken

  try {
    instructorToken = await login(
      process.env.INSTRUCTOR_EMAIL,
      process.env.INSTRUCTOR_PASSWORD
    )
    studentToken = await login(
      process.env.STUDENT_EMAIL,
      process.env.STUDENT_PASSWORD
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
    return
  }

  const validResult = await runTest(
    "valid instructor request",
    200,
    buildRequest(instructorToken, {
      title: "Modern JavaScript Development",
      category: "Web Development",
      level: "beginner",
      keyPoints: "ES6, async programming, APIs",
    }),
    (body) =>
      body.data &&
      typeof body.data.description === "string" &&
      Array.isArray(body.data.tags) &&
      typeof body.data.whatYouWillLearn === "string" &&
      Array.isArray(body.data.requirements) &&
      Array.isArray(body.data.outline)
  )

  if (validResult.passed) {
    console.log(`description: ${validResult.body.data.description}`)
    console.log(`outline sections: ${validResult.body.data.outline.length}`)
  }

  const results = [
    validResult,
    await runTest(
      "no token",
      401,
      buildRequest("", {
        title: "Modern JavaScript Development",
      })
    ),
    await runTest(
      "student token",
      403,
      buildRequest(studentToken, {
        title: "Modern JavaScript Development",
      })
    ),
    await runTest(
      "invalid title",
      400,
      buildRequest(instructorToken, {
        title: "JS",
      })
    ),
  ]

  const passedCount = results.filter((result) => result.passed).length
  console.log(`${passedCount}/${results.length} passed`)

  if (passedCount !== results.length) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
