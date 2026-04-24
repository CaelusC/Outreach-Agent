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

  static #getTopLevel(raw, key) {
    const m = raw.match(new RegExp(`^${key}:\\s*"?([^"\\n#~]+)"?`, 'm'))
    return m ? m[1].trim() : null
  }
  
  static #getBlock(raw, key) {
    const m = raw.match(new RegExp(`^${key}:\\s*\\|\\n((?:[ \\t]+.*\\n?)*)`, 'm'))
    if (!m) return ''
    return m[1].replace(/^[ \t]{2}/gm, '').trimEnd()
  }


  static #parse(raw) {
    const get = (key) => ConfigLoader.#get(raw, key)
    const getTop = (key) => ConfigLoader.#getTopLevel(raw, key)
    const getList = (key) => ConfigLoader.#getList(raw, key)
    const getBlock = (key) => ConfigLoader.#getBlock(raw, key)

    return {
      purpose:            getTop('purpose') || 'outreach',
      custom_goal:        getTop('custom_goal') || null,
      footer:             getBlock('footer') || null,
      attachments_folder: get('attachments_folder') || null,
      
      search: {
        location:       get('location'),
        radius_km:      parseInt(get('radius_km')) || 50,
        industry_focus: get('industry_focus'),
        min_companies:  parseInt(get('min_companies')) || 1,
        exclude_domains: getList('exclude_domains'),
      },
      about: {
        organisation:  get('organisation') || '',
        context:       get('context') || '',
        background:    getList('background'),
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

      footer:              getBlock('footer') || null,
      attachments_folder:  get('attachments_folder') || 'data',
    }
  }
}
