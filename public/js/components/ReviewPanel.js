import { store } from '../store.js'

//ReviewPanel manages the list of companies, filtering them by status, and selecting a company to view in the DetailDrawer.
export class ReviewPanel {
  #currentFilter = 'draft'
  #selectedId = null
  #onSelect

  constructor(onSelect) {
    this.#onSelect = onSelect

    document.querySelectorAll('.rtab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.rtab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        this.#currentFilter = tab.dataset.filter
        this.render()
      })
    })

    store.subscribe(() => this.render())
  }

  setSelected(id) {
    this.#selectedId = id
    this.render()
  }

  render() {
    this.#updateCounts()
    this.#renderList()
  }

  #updateCounts() {
    const { draft, approved, sent, total } = store.counts()
    document.getElementById('cntDraft').textContent = draft
    document.getElementById('cntApproved').textContent = approved
    document.getElementById('cntSent').textContent = sent
    document.getElementById('cntAll').textContent = total
    document.getElementById('statsLabel').textContent = `${draft} drafts · ${sent} sent`
  }

  //Renders the list of companies depending on the current filter. Also sets up buttons for each company item to select it and show details in the DetailDrawer.
  #renderList() {
    const list = document.getElementById('companyList')
    const filtered = this.#currentFilter === 'all'
      ? store.companies
      : store.companies.filter(c => c.status === this.#currentFilter)

    if (!filtered.length) {
      list.innerHTML = `<div class="empty">
        <div class="empty-icon">◫</div>
        <div>${
          this.#currentFilter === 'draft' ? 'No drafts yet' :
          this.#currentFilter === 'sent' ? 'Nothing sent yet' : 'Nothing here'
        }</div>
      </div>`
      return
    }

    list.innerHTML = filtered.map(c => `
      <div class="company-item ${c.id === this.#selectedId ? 'selected' : ''}"
           data-id="${c.id}">
        <div class="company-item-inner">
          <div class="ci-top">
            <div class="ci-name">${c.name}</div>
            <span class="status-pill sp-${c.status}">${c.status}</span>
          </div>
          <div class="ci-desc">${c.description || '—'}</div>
          <div class="ci-meta">
            <span class="ci-email">${c.email_found || 'no email'}</span>
            <span style="color:var(--text3);font-family:monospace;font-size:10px">${c.industry || ''}</span>
          </div>
        </div>
      </div>
    `).join('')

    list.querySelectorAll('.company-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id)
        this.#onSelect?.(id)
      })
    })
  }
}
