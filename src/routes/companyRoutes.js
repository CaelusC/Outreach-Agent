import { Router } from 'express'
import { CompanyRepository } from '../db/CompanyRepository.js'

export function companyRoutes(mailer) {
  const router = Router()

  router.get('/', (req, res) => {
    res.json(CompanyRepository.getAll())
  })

  router.get('/:id', (req, res) => {
    const company = CompanyRepository.getById(req.params.id)
    if (!company) return res.status(404).json({ error: 'Not found' })
    res.json(company)
  })

  router.put('/:id/draft', (req, res) => {
    const { subject, body } = req.body
    CompanyRepository.updateDraft(req.params.id, subject, body)
    res.json({ ok: true })
  })

  router.post('/:id/approve', (req, res) => {
    const { subject, body } = req.body
    if (subject && body) CompanyRepository.updateDraft(req.params.id, subject, body)
    CompanyRepository.updateStatus(req.params.id, 'approved')
    res.json({ ok: true })
  })

  router.post('/:id/reject', (req, res) => {
    CompanyRepository.updateStatus(req.params.id, 'rejected')
    res.json({ ok: true })
  })

  router.post('/:id/send', async (req, res) => {
    const company = CompanyRepository.getById(req.params.id)
    if (!company) return res.status(404).json({ error: 'Not found' })
    if (company.status !== 'approved') return res.status(400).json({ error: 'Not approved' })
    if (!company.email_found) return res.status(400).json({ error: 'No email address' })

    try {
      await mailer.send({ to: company.email_found, subject: company.subject, body: company.body })
      CompanyRepository.markSent(company.id)
      res.json({ ok: true })
    } catch (e) {
      CompanyRepository.updateStatus(company.id, 'failed')
      res.status(500).json({ error: e.message })
    }
  })

  return router
}
