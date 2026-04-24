import nodemailer from 'nodemailer'
import { readdirSync, statSync, readFileSync, existsSync } from 'fs'
import { join, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10MB total

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

  //Attachments folder
  #resolveAttachmentsFolder(folderPath) {
    if (!folderPath) return null
    //If absolute path, use it as it is. Or resolve from project root
    if (folderPath.startsWith('/')) return folderPath
    return join(__dirname, '../../', folderPath)
  }

  #loadAttachments(folderPath) {
    if (!folderPath) return []

    const resolved = this.#resolveAttachmentsFolder(folderPath)
    if (!existsSync(resolved)) {
      console.warn(`[Mailer] attachments folder not found: ${resolved}`)
      return []
    }

    let files
    try {
      files = readdirSync(resolved).filter(f => !f.startsWith('.'))
    } catch (e) {
      console.warn(`[Mailer] could not read attachments folder: ${e.message}`)
      return []
    }

    const attachments = []
    let totalSize = 0

    for (const file of files) {
      const filePath = join(resolved, file)
      const stat = statSync(filePath)

      if (totalSize + stat.size > MAX_ATTACHMENT_BYTES) {
        console.warn(`[Mailer] skipping ${file}, would exceed 10MB total attachment limit`)
        continue
      }

      attachments.push({
        filename: basename(file),
        content: readFileSync(filePath),
      })

      totalSize += stat.size
      console.debug(`[Mailer] attaching ${file} (${(stat.size / 1024).toFixed(1)}KB)`)
    }

    console.debug(`[Mailer] total attachments: ${attachments.length} files, ${(totalSize / 1024).toFixed(1)}KB`)
    return attachments
  }

  async send({ to, subject, body, attachmentsFolder = null }) {
    const attachments = this.#loadAttachments(attachmentsFolder)

    const info = await this.#transporter.sendMail({
      from:        `"${process.env.SENDER_NAME || ' '}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text:        body,
      html:        body.replace(/\n/g, '<br>'),
      attachments,
    })

    console.debug(`[Mailer] sent to=${to} messageId=${info.messageId} attachments=${attachments.length}`)
    return info.messageId
  }

  async verify() {
    return this.#transporter.verify()
  }
}