import 'dotenv/config'
import express from 'express'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

import { Agent } from './agent/Agent.js'
import { Mailer } from './mail/Mailer.js'
import { SSEBroadcaster } from './sse/SSEBroadcaster.js'
import { agentRoutes } from './routes/agentRoutes.js'
import { companyRoutes } from './routes/companyRoutes.js'
import { runRoutes } from './routes/runRoutes.js'
import { healthRoutes } from './routes/healthRoutes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

//Instantiate services and dependencies
const agent = new Agent()
const mailer = new Mailer()
const broadcaster = new SSEBroadcaster()

//Express setup
const app = express()
app.use(express.json())
app.use(express.static(join(__dirname, '../public')))

//Routes
app.use('/api/agent', agentRoutes(agent, broadcaster))
app.use('/api/companies', companyRoutes(mailer))
app.use('/api/runs', runRoutes())
app.use('/api/health', healthRoutes(agent, mailer))

//Is localhost for saftey reasons. In production should probably be behind a reverse proxy with SSL and basic auth.
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Outreach Started: http://localhost:${PORT}`))
