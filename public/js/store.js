import { api } from './api.js'

//simple state management for the list of companies. Manages subcribtions to changes and provides a method to refresh the data from the server.
class Store {
  #companies = []
  #listeners = []

  get companies() { return this.#companies }

  async refresh() {
    this.#companies = await api('/api/companies')
    this.#notify()
  }

  subscribe(fn) {
    this.#listeners.push(fn)
  }

  #notify() {
    this.#listeners.forEach(fn => fn(this.#companies))
  }

  counts() {
    return {
      draft:    this.#companies.filter(c => c.status === 'draft').length,
      approved: this.#companies.filter(c => c.status === 'approved').length,
      sent:     this.#companies.filter(c => c.status === 'sent').length,
      total:    this.#companies.length,
    }
  }
}

export const store = new Store()
