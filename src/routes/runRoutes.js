import { Router } from 'express'
import { RunRepository } from '../db/RunRepository.js'
import { CompanyRepository } from '../db/CompanyRepository.js'

export function runRoutes() {
  const router = Router()

  router.get('/', (req, res) => {
    res.json(RunRepository.getAll())
  })

  router.get('/:id', (req, res) => {
    const run = RunRepository.getById(req.params.id)
    if (!run) return res.status(404).json({ error: 'Not found' })
    res.json(run)
  })

  router.get('/:id/companies', (req, res) => {
    res.json(CompanyRepository.getByRunId(req.params.id))
  })

  return router
}
