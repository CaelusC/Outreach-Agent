//EmailFinder uses an LLM (can be any), with prompt injection to find the public contact email for a given company domain. Return clean email or null.
export class EmailFinder {
  #llm

  constructor(llmClient) {
    this.#llm = llmClient
  }

  async find(domain, companyName) {
    const prompt = `Search up what is the public contact email address for ${companyName} (${domain})?
Return only the contact email address. No explanation. No sentences. Email only. If unknown, return null.`

    const raw = await this.#llm.call(
      [{ role: 'user', content: prompt }],
      null,
      64,
      `EmailFinder:${domain}`
    )

    const clean = raw.trim()
    if (clean && clean !== 'null' && /^[^\s]+@[^\s]+\.[^\s]+$/.test(clean)) {
      return clean.toLowerCase()
    }

    console.debug(`[EmailFinder] no valid email for ${domain}, got: "${clean}"`)
    return null
  }
}
