import { Router } from 'express'

export function healthRoutes(agent, mailer) {
  const router = Router()

  router.get('/', async (req, res) => {
    try {
      await mailer.verify()
      res.json({ smtp: 'ok', agent: agent.isRunning ? 'running' : 'idle' })
    } catch (e) {
      res.json({ smtp: 'error', message: e.message, agent: agent.isRunning ? 'running' : 'idle' })
    }
  })

  return router
}
