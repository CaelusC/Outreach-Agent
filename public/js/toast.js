//reusalbe toast notification component for either erros or successes and auto dissapears after a few seconds.
class Toast {
  #el
  #timer

  constructor() {
    this.#el = document.getElementById('toast')
  }

  show(msg, type = '') {
    this.#el.textContent = msg
    this.#el.className = `toast show ${type}`
    clearTimeout(this.#timer)
    this.#timer = setTimeout(() => this.#el.classList.remove('show'), 3000)
  }

  ok(msg)  { this.show(msg, 'ok') }
  err(msg) { this.show(msg, 'err') }
}

export const toast = new Toast()
