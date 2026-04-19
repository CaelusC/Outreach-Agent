import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = join(__dirname, '../../data/config.yaml')

//Loads and parses the config.yaml file. Provides defaults for any missing args and logs the loaded config for debugging.
export class ConfigLoader {
  static load() {
    console.debug(`[ConfigLoader] loading from ${CONFIG_PATH}`)
    const raw = readFileSync(CONFIG_PATH, 'utf-8')
    const config = ConfigLoader.#parse(raw)
    console.debug(`[ConfigLoader] location=${config.search.location} radius=${config.search.radius_km}km min=${config.search.min_companies}`)
    return config
  }

  static #get(raw, key) {
    const m = raw.match(new RegExp(`^  ${key}:\\s*"?([^"\\n#]+)"?`, 'm'))
    return m ? m[1].trim() : null
  }

  static #getList(raw, sectionKey) {
    const m = raw.match(new RegExp(`${sectionKey}:\\s*\\n((?:\\s+- .+\\n?)+)`))
    if (!m) return []
    return m[1].match(/- (.+)/g)?.map(l => l.replace('- ', '').trim()) || []
  }

  static #parse(raw) {
    const get = (key) => ConfigLoader.#get(raw, key)
    const getList = (key) => ConfigLoader.#getList(raw, key)

    return {
      search: {
        location:       get('location'),
        radius_km:      parseInt(get('radius_km')) || 50,
        industry_focus: get('industry_focus'),
        min_companies:  parseInt(get('min_companies')) || 15,
        exclude_domains: getList('exclude_domains'),
      },
      association: {
        name:          get('name') || 'sv-ADA',
        university:    get('university'),
        program:       get('program'),
        member_count:  get('member_count'),
        what_we_offer: getList('what_we_offer'),
        looking_for:   getList('looking_for'),
      },
      sender: {
        name:  get('name') || '',
        role:  get('role') || '',
        email: get('email') || '',
        phone: get('phone') || '',
      },
      email_style: {
        tone:      get('tone'),
        max_words: parseInt(get('max_words')) || 180,
        language:  get('language') || 'English',
        avoid:     getList('avoid'),
      },
    }
  }
}
