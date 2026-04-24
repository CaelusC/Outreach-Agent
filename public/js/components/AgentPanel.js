import { api } from '../api.js'
import { toast } from '../toast.js'

//AgentPanel manages the agent's status, starting the agent, and displaying logs
export class AgentPanel {
  #logWrap
  #runBtn
  #statusDot
  #statusLabel

  constructor() {
    this.#logWrap = document.getElementById('logWrap')
    this.#runBtn = document.getElementById('runBtn')
    this.#statusDot = document.getElementById('statusDot')
    this.#statusLabel = document.getElementById('statusLabel')

    this.#runBtn.addEventListener('click', () => this.#startAgent())
    this.#loadConfig()
  }

  //loads the current agent configuration and updates the UI
  async #loadConfig() {
    try {
      const cfg = await api('/api/agent/config')
      document.getElementById('cfgPurpose').textContent = cfg.purpose || '—'
      document.getElementById('cfgLocation').textContent = cfg.search?.location || '—'
      document.getElementById('cfgRadius').textContent = cfg.search?.radius_km ? cfg.search.radius_km + ' km' : '—'
      document.getElementById('cfgIndustry').textContent = cfg.search?.industry_focus || '—'
      document.getElementById('cfgMin').textContent = cfg.search?.min_companies || '—'
      document.getElementById('cfgLang').textContent = cfg.email_style?.language || '—'
    } catch {}
  }

  //logs output with some basic formatting. Highlights any errors or successes and auto-scrolls to the bottom.
  appendLog(line) {
    const empty = this.#logWrap.querySelector('.log-empty')
    if (empty) empty.remove()

    const el = document.createElement('div')
    el.className = 'log-line' +
      (line.startsWith('+') ? ' highlight' : line.startsWith('x') || line.startsWith('Error') ? ' error' : '')
    el.textContent = line
    this.#logWrap.appendChild(el)
    this.#logWrap.scrollTop = this.#logWrap.scrollHeight
  }

  //updates the UI depending on if the agent is running or not
  setRunning(running) {
    this.#statusDot.className = 'status-dot' + (running ? ' running' : ' done')
    this.#statusLabel.textContent = running ? 'agent running' : 'idle'
    this.#runBtn.disabled = running
    this.#runBtn.textContent = running ? 'Running' : 'Start Agent'
  }

  //starts the agent and updates the UI, shows an error toast if it fails
  async #startAgent() {
    try {
      await api('/api/agent/start', 'POST')
      this.setRunning(true)
    } catch (e) {
      toast.err(e.message)
    }
  }
}
