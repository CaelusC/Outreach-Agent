import nodemailer from 'nodemailer'

export class Mailer {
  #transporter

  constructor() {
    this.#transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }

  async send({ to, subject, body }) {
    const info = await this.#transporter.sendMail({
      from: `"${process.env.SENDER_NAME || '-'}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
    })
    console.debug(`[Mailer] sent to=${to} messageId=${info.messageId}`)
    return info.messageId
  }

  async verify() {
    return this.#transporter.verify()
  }
}
