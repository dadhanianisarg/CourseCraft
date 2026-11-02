module.exports = function extractJson(text) {
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")

  if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
    throw new Error("The model response did not contain a JSON object")
  }

  return text.slice(firstBrace, lastBrace + 1)
}
