//CompanyFinder uses an LLM (can be any), with prompt injection to find companies. It processes the raw response. And returns clean list.
export class CompanyFinder {
  #llm

  constructor(llmClient) {
    this.#llm = llmClient
  }

  async find(searchConfig, log) {
    const { location, radius_km, industry_focus, min_companies, exclude_domains } = searchConfig

    const prompt = `List ${min_companies}+ focusing on (${industry_focus}) within ${radius_km}km of ${location}, Netherlands.
Only include companies you are confident actually exist with a real website.
Excluded domains: ${exclude_domains.join(',') || 'none'}
JSON array only, no prose:
[{"n":"name","d":"domain.nl","i":"industry","l":"city,NL","desc":"1 sentence what they actually do"}]`

    log(`  Querying for Company List...`)

    const raw = await this.#llm.call(
      [{ role: 'user', content: prompt }],
      `JSON only. No prose. No markdown. No explanation.`,
      3072,
      'CompanyFinder'
    )

    let companies = []
    const m = raw.match(/\[[\s\S]*\]/)
    if (!m) {
      console.error(`[CompanyFinder] no JSON array in response. Full: ${raw}`)
      log(`  There is no JSON array in response. Check out debug logs!`)
      return []
    }

    let jsonStr = m[0]
    try {
      companies = JSON.parse(jsonStr)
      console.debug(`[CompanyFinder] parsed ${companies.length} raw entries`)
    } catch {
      //Last entry filed. Strip and retry
      jsonStr = jsonStr.replace(/,\s*\{[^}]*$/, ']')
      try {
        companies = JSON.parse(jsonStr)
        console.debug(`[CompanyFinder] Truncation recovery used, parsed ${companies.length} entries`)
      } catch (e2) {
        console.error(`[CompanyFinder] Parse failed after recovery: ${e2.message}`)
        log(`  parse error: ${e2.message}`)
        return []
      }
    }

    const filtered = companies
      .filter(c => (c.n || c.name) && (c.d || c.domain))
      .filter(c => !exclude_domains.includes(c.d || c.domain))
      .map(c => ({
        name:        c.n    || c.name,
        domain:      c.d    || c.domain,
        industry:    c.i    || c.industry    || '',
        location:    c.l    || c.location    || '',
        description: c.desc || c.description || '',
      }))

    console.debug(`[CompanyFinder] ${filtered.length} Companies after filtering`)
    filtered.forEach(c => console.debug(`  - ${c.name} | ${c.domain} | ${c.location}`))
    return filtered
  }
}
