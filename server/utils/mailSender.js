const mailSender = async (email, title, body) => {
    if (
        !process.env.GOOGLE_APPS_SCRIPT_URL ||
        !process.env.GOOGLE_APPS_SCRIPT_TOKEN
    ) {
        throw new Error(
            "GOOGLE_APPS_SCRIPT_URL and GOOGLE_APPS_SCRIPT_TOKEN must be configured"
        )
    }

    const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token: process.env.GOOGLE_APPS_SCRIPT_TOKEN,
            to: email,
            subject: title,
            html: body,
        }),
    })

    const result = await response.json()
    if (!response.ok || !result.success) {
        throw new Error(
            result.message || "Google Apps Script email delivery failed"
        )
    }

    return {
        messageId: result.messageId || "google-apps-script",
        response: result.messageId || "google-apps-script",
    }
}

module.exports = mailSender
