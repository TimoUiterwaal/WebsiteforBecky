import { injectShell } from '../js/shell.js'
import { getState, setState } from '../js/storage.js'

injectShell()

// Show secret badge on first visit
if (!getState('menuSeen')) {
  setState('menuSeen', true)
  const reveal = document.getElementById('secretReveal')
  reveal.style.display = 'block'
  setTimeout(() => reveal.style.display = 'none', 4000)
}
