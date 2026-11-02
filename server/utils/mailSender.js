const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT || 587),
        secure: Number(process.env.MAIL_PORT) === 465,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    })

    return transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: title,
        html: body,
    })
}


module.exports = mailSender;