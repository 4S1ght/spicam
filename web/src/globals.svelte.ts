
import * as dicts from './dictionary'

const lang = localStorage.getItem('lang') as dicts.Language || 'english'

const globals = $state({
    loggedIn: false,
    username: '',
    route: '',
    lang: lang,
    dicts: Object.keys(dicts) as dicts.Language[],
    dict: dicts[lang]
})

console.log(globals)

export default globals