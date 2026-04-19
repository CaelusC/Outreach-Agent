import { store } from './store.js'
import { AgentPanel } from './components/AgentPanel.js'
import { ReviewPanel } from './components/ReviewPanel.js'
import { DetailDrawer } from './components/DetailDrawer.js'

class App {
  #agentPanel
  #reviewPanel
  #drawer

  async init() {
    this.#drawer = new DetailDrawer(() => {
      this.#reviewPanel.setSelected(null)
    })

    this.#reviewPanel = new ReviewPanel((id) => {
      this.#reviewPanel.setSelected(id)
      this.#drawer.open(id)
    })

    this.#agentPanel = new AgentPanel()

    await store.refresh()

    this.#connectSSE()
    setInterval(() => store.refresh(), 8000)
  }

  //connectSSE sets up a Server Sent Events connection to receive live updates from the server. Also polls agents status.
  #connectSSE() {
    const es = new EventSource('/api/agent/stream')

    es.onmessage = async (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'log') {
        this.#agentPanel.appendLog(msg.line)
      }
      if (msg.type === 'company') {
        await store.refresh()
      }
    }

    es.onerror = () => {
      //SSE reconnects automatically
    }

    //Poll agent status to detect when its done
    const poll = setInterval(async () => {
      try {
        const { running } = await (await fetch('/api/agent/status')).json()
        if (!running) {
          this.#agentPanel.setRunning(false)
          await store.refresh()
          clearInterval(poll)
        }
      } catch {}
    }, 3000)
  }
}

const app = new App()
app.init()
