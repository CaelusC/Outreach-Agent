import { Router } from 'express'
import { ConfigLoader } from '../config/ConfigLoader.js'

export function agentRoutes(agent, broadcaster) {
  const router = Router()

  router.get('/stream', (req, res) => {
    broadcaster.attach(req, res)
  })

  router.post('/start', async (req, res) => {
    if (agent.isRunning) return res.status(409).json({ error: 'Agent Already Running' })

    agent.reset()
    res.json({ ok: true })

    agent.run(
      (line) => broadcaster.broadcastLog(line),
      (data) => broadcaster.broadcastCompany(data)
    )
      .then(() => broadcaster.broadcastLog('+ Agent Finished.'))
      .catch((e) => broadcaster.broadcastLog(`x Agent Error: ${e.message}`))
  })

  router.get('/status', (req, res) => {
    res.json({ running: agent.isRunning })
  })

  router.get('/config', (req, res) => {
    try {
      res.json(ConfigLoader.load())
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })

  return router
}
