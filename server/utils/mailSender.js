const mailSender = async (email, title, body) => {
    if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
        throw new Error("RESEND_API_KEY and MAIL_FROM must be configured")
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: process.env.MAIL_FROM,
            to: [email],
            subject: title,
            html: body,
        }),
    })

    const result = await response.json()
    if (!response.ok) {
        throw new Error(result.message || "Resend email delivery failed")
    }

    return {
        messageId: result.id,
        response: result.id,
    }
}


module.exports = mailSender;