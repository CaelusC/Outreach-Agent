//Handles all the live updates for frontend.
export class SSEBroadcaster {
  #clients = new Set()

  attach(req, res) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    this.#clients.add(res)
    req.on('close', () => this.#clients.delete(res))
    console.debug(`[SSE] Client Connected (total=${this.#clients.size})`)
  }

  #send(payload) {
    const data = `data: ${JSON.stringify(payload)}\n\n`
    for (const client of this.#clients) {
      client.write(data)
    }
  }

  broadcastLog(line) {
    this.#send({ type: 'log', line })
  }

  broadcastCompany(data) {
    this.#send({ type: 'company', ...data })
  }
}
