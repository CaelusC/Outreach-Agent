import { api } from '../api.js'
import { toast } from '../toast.js'
import { store } from '../store.js'

//DetailDrawer manages the side drawer that shows company details(hence the name), allows editing email drafts, and approving/sending the emails.
export class DetailDrawer {
  #el
  #selectedId = null
  #onClose

  constructor(onClose) {
    this.#el = document.getElementById('detailDrawer')
    this.#onClose = onClose

    document.getElementById('drawerCloseBtn').addEventListener('click', () => this.close())
  }

  //Opens the view and populates it with the company's details. Also sets up the buttons in the footer depending on company status.
  open(id) {
    this.#selectedId = id
    const company = store.companies.find(c => c.id === id)
    if (!company) return

    document.getElementById('ddName').textContent = company.name
    document.getElementById('ddDomain').textContent = company.domain
    document.getElementById('ddIndustry').textContent = company.industry || '—'
    document.getElementById('ddLocation').textContent = company.location || '—'
    document.getElementById('ddDesc').textContent = company.description || '—'
    document.getElementById('ddEmail').textContent = company.email_found || 'not found'
    document.getElementById('ddEmailOverride').value = ''
    document.getElementById('ddSubject').value = company.subject || ''
    document.getElementById('ddBody').value = company.body || ''

    this.#renderFooter(company)
    this.#el.classList.add('open')
  }

  close() {
    this.#el.classList.remove('open')
    this.#selectedId = null
    this.#onClose?.()
  }

  get selectedId() { return this.#selectedId }

  //Renders the button in the footer depending on the company's status.
  #renderFooter(company) {
    const footer = document.getElementById('detailFooter')
    const btnApprove = document.getElementById('btnApprove')
    const btnSend    = document.getElementById('btnSend')
    const btnReject  = document.getElementById('btnReject')

    if (company.status === 'approved') {
      btnApprove.style.display = 'none'
      btnSend.style.display    = ''
      btnReject.style.display  = ''
    } else if (company.status === 'sent') {
      btnApprove.style.display = 'none'
      btnSend.style.display    = 'none'
      btnReject.style.display  = 'none'
    } else {
      btnApprove.style.display = ''
      btnSend.style.display    = 'none'
      btnReject.style.display  = company.status !== 'rejected' ? '' : 'none'
    }

    document.getElementById('btnSaveDraft').onclick = () => this.saveDraft()
    btnApprove.onclick = () => this.approve()
    btnSend.onclick = () => this.send()
    btnReject.onclick = () => this.reject()
  }

  //Saves and shows toast on success
  async saveDraft() {
    if (!this.#selectedId) return
    const subject = document.getElementById('ddSubject').value
    const body    = document.getElementById('ddBody').value
    await api(`/api/companies/${this.#selectedId}/draft`, 'PUT', { subject, body })
    await store.refresh()
    toast.ok('Saved')
  }


  async approve() {
    if (!this.#selectedId) return
    const subject = document.getElementById('ddSubject').value
    const body    = document.getElementById('ddBody').value
    await api(`/api/companies/${this.#selectedId}/approve`, 'POST', { subject, body })
    await store.refresh()
    const company = store.companies.find(c => c.id === this.#selectedId)
    if (company) this.#renderFooter(company)
    toast.ok('Approved — and ready to send')
  }

  //Sends the email, shows a toast on success, and updates the view. If it fails, shows an error toast and re-enables the send button.
  async send() {
    if (!this.#selectedId) return
    const btn = document.getElementById('btnSend')
    btn.disabled    = true
    btn.textContent = 'sending...'

    try {
      await api(`/api/companies/${this.#selectedId}/send`, 'POST')
      toast.ok('Sent!')
      this.close()
      await store.refresh()
    } catch (e) {
      toast.err(e.message)
    } finally {
      //resets button in case of failure
      btn.disabled    = false
      btn.textContent = 'Send'
    }
  }

  async reject() {
    if (!this.#selectedId) return
    await api(`/api/companies/${this.#selectedId}/reject`, 'POST')
    this.close()
    await store.refresh()
    toast.show('Rejected')
  }
}
