//EmailWriter uses an LLM (can be any), with prompt injection to write outreach email drafts for companies. It returns clean JSON with subject and body thats later editable.
const PURPOSE_INSTRUCTIONS = {
  outreach: `You are writing a partnership outreach email. Goal: establish a mutually beneficial relationship between the sender's organisation and the target company.`,
  internship: `You are writing a internship inquiry email. Goal: ask if the company has internship opportunities and present the sender's background and skills.`,
  job_application: `You are writing a job application email. Goal: express interest in working at the company and briefly pitch why the sender would be a good fit.`,
  custom: null, // filled in dynamically from custom_goal
}

export class EmailWriter {
  #llm
  #systemPrompt = null

  constructor(llmClient) {
    this.#llm = llmClient
  }

  #buildSystemPrompt(config) {
    const { purpose, custom_goal, about, sender, email_style, footer } = config

    const purposeInstruction = purpose === 'custom'
      ? `You are writing an email with the following goal: ${custom_goal}`
      : (PURPOSE_INSTRUCTIONS[purpose] || PURPOSE_INSTRUCTIONS.outreach)

    const prompt = `${purposeInstruction}

Sender: ${sender.name}, ${sender.role} <${sender.email}>${sender.phone ? ` | ${sender.phone}` : ''}
Organisation: ${about.organisation} — ${about.context}
Background: ${about.background.join(' | ')}
Offers: ${about.what_we_offer.join(' | ')}
Wants: ${about.looking_for.join(' | ')}

Style rules: ${email_style.tone}. Max ${email_style.max_words} words. Language: ${email_style.language}. Never use: ${email_style.avoid.join(', ')}. No fluff opener. One clear CTA. Reference what the company specifically does and use it.
${footer ? `\nAppend this footer exactly as-is at the end of every email body:\n${footer}` : ''}
Output: {"subject":"...","body":"..."} JSON only, no markdown.`

    console.debug(`[EmailWriter] system prompt built, purpose=${purpose} chars=${prompt.length}`)
    return prompt
  }

  async write(company, config) {
    if (!this.#systemPrompt) {
      this.#systemPrompt = this.#buildSystemPrompt(config)
    }

    const user = `Company: ${company.name} (${company.domain})
Does: ${company.description}
Industry: ${company.industry} | ${company.location}`

    const raw = await this.#llm.call(
      [{ role: 'user', content: user }],
      this.#systemPrompt,
      600,
      `EmailWriter:${company.domain}`
    )

    try {
      return JSON.parse(raw)
    } catch {
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) {
        console.debug(`[EmailWriter] fallback JSON extraction used for ${company.domain}`)
        return JSON.parse(m[0])
      }
      console.error(`[EmailWriter] failed to parse JSON for ${company.domain}. Raw: ${raw}`)
      throw new Error('bad JSON from model')
    }
  }

  resetCache() {
    console.debug(`[EmailWriter] cache cleared`)
    this.#systemPrompt = null
  }
}