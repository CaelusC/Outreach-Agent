import { ConfigLoader } from '../config/ConfigLoader.js'
import { RunRepository } from '../db/RunRepository.js'
import { CompanyRepository } from '../db/CompanyRepository.js'
import { LLMClient } from './LLMClient.js'
import { CompanyFinder } from './CompanyFinder.js'
import { EmailFinder } from './EmailFinder.js'
import { EmailWriter } from './EmailWriter.js'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
//Agent class manages the overall flow/states of the AI agent. Running the different phases: company finding, email finding, email writing.
export class Agent {
  #llm
  #companyFinder
  #emailFinder
  #emailWriter
  #running = false

  constructor() {
    this.#llm = new LLMClient()
    this.#companyFinder = new CompanyFinder(this.#llm)
    this.#emailFinder = new EmailFinder(this.#llm)
    this.#emailWriter = new EmailWriter(this.#llm)
  }

  get isRunning() {
    return this.#running
  }

  reset() {
    this.#emailWriter.resetCache()
    console.debug(`[Agent] Reset`)
  }

  async run(onLog, onCompanyFound) {
    if (this.#running) throw new Error('Agent Already Running')

    console.log(`[Agent] Starting`)
    this.#running = true
    const config = ConfigLoader.load()
    const runId = RunRepository.create()

    const log = (msg) => {
      RunRepository.appendLog(runId, msg)
      onLog?.(msg)
      console.log(`[run:${runId}] ${msg}`)
    }

    //Sanity checks
    if (!process.env.OPENROUTER_API_KEY) {
      log(`ERROR: OPENROUTER_API_KEY not set in .env`)
      RunRepository.finish(runId, 'error')
      this.#running = false
      return
    }
    if (!process.env.GMAIL_USER) {
      log(`WARN: GMAIL_USER not set in .env`)
    }

    //PHASE 1: Company Finding
    try {
      log(`Started on ${config.search.location} ${config.search.radius_km}km`)
      log(`Phase 1: Researching Companies`)

      const companies = await this.#companyFinder.find(config.search, log)
      log(`Found ${companies.length} Companies`)

      if (companies.length === 0) {
        log(`NO COMPANIES FOUND. Something went wrong. Check Agents output in debug logs!`)
        RunRepository.finish(runId, 'done')
        this.#running = false
        return
      }

      for (const [i, company] of companies.entries()) {
        log(`[${i + 1}/${companies.length}] ${company.name} (${company.domain})`)

        const row = CompanyRepository.insert({
          run_id:      runId,
          name:        company.name,
          domain:      company.domain,
          industry:    company.industry,
          location:    company.location,
          description: company.description,
          email_found: null,
          email_source: 'agent',
        })

        if (!row) {
          log(`Skip. Is already in Database`)
          continue
        }

        const companyId = row.lastInsertRowid
        console.debug(`[Agent] Inserted Company id=${companyId}`)

        //PHASE 1.2: Finding Emails
        log(` Finding Email...`)
        const email = await this.#emailFinder.find(company.domain, company.name)
        if (email) {
          log(` Email: ${email}`)
          CompanyRepository.updateEmail(companyId, email)
        } else {
          log(`  No email found. You need to find one Manually or Reject. Domain: ${company.domain}`)
        }

        //PHASE 2: Writing Draft
        log(`  writing draft...`)
        try {
          const draft = await this.#emailWriter.write({ ...company, email }, config)
          CompanyRepository.updateDraft(companyId, draft.subject, draft.body)
          log(` + Draft Ready`)
          onCompanyFound?.({ companyId, name: company.name, domain: company.domain })
        } catch (e) {
          log(` x Draft Failed: ${e.message}`)
          console.error(`[Agent] EmailWriter Error for ${company.domain}:`, e)
        }

        await sleep(1000 + Math.random() * 1000)
      }

      RunRepository.finish(runId, 'done')
      log(`Done. ${companies.length} Drafts Ready!`)
      return runId

    } catch (e) {
      RunRepository.finish(runId, 'error')
      log(`Error: ${e.message}`)
      console.error(`[Agent] fatal error:`, e)
      throw e
    } finally {
      this.#running = false
    }
  }
}
