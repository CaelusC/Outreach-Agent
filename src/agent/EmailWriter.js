//EmailWriter uses an LLM (can be any), with prompt injection to write outreach email drafts for companies. It returns clean JSON with subject and body thats later editable.
export class EmailWriter {
  #llm
  #systemPrompt = null

  constructor(llmClient) {
    this.#llm = llmClient
  }

  #buildSystemPrompt(config) {
    const { association, sender, email_style } = config
    const prompt = `Write outreach emails for ${association.name} (${association.program} @ ${association.university}, ~${association.member_count || '?'} members).
Offers: ${association.what_we_offer.join(' | ')}
Wants: ${association.looking_for.join(' | ')}
From: ${sender.name}, ${sender.role} <${sender.email}>${sender.phone ? ` ${sender.phone}` : ''}
Rules: ${email_style.tone}. Max ${email_style.max_words} words. Lang: ${email_style.language}. Never use: ${email_style.avoid.join(',')}. No fluff opener. 1 CTA. Reference what the company specifically does. Write as a genuine human being,
Output: {"subject":"...","body":"..."} JSON only, no markdown.`
    console.debug(`[EmailWriter] system prompt built (${prompt.length} chars)`)
    return prompt
  }

  async write(company, config) {
    //Build system prompt once. Reused for all companies, to save tokens and get more consistent output.
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
    console.debug(`[EmailWriter] system prompt cache cleared`)
    this.#systemPrompt = null
  }
}
