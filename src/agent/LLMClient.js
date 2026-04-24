const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'openai/gpt-oss-120b:free' //Using a free open source model (Can be changed to any other LLM, even a local one, by just changing the endpoint and response processing in this class)
const TIMEOUT_MS = 300000 // 5 min, to allow for long response just in case the LLM is slow

export class LLMClient {
  async call(messages, systemPrompt = null, maxTokens = 1024, label = 'llm') {
    const inputChars = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0)
    console.debug(`[LLMClient:${label}] model=${MODEL} max_tokens=${maxTokens} input_chars=${inputChars}`)

    const body = {
      model: MODEL,
      max_tokens: maxTokens,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
    }

    const t0 = Date.now()
    const res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[LLMClient:${label}] error ${res.status}: ${err}`)
      throw new Error(`OpenRouter ${res.status}: ${err}`)
    }

    const data = await res.json()
    const output = data.choices?.[0]?.message?.content?.trim() || ''
    const elapsed = Date.now() - t0
    console.debug(`[LLMClient:${label}] response in ${elapsed}ms output_chars=${output.length}`)
    console.debug(`[LLMClient:${label}] preview: ${output.slice(0, 300)}${output.length > 300 ? '...' : ''}`)

    return output
  }
}
