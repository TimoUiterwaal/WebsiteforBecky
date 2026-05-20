import { injectShell, showToast } from '../js/shell.js'
import { getState, setState } from '../js/storage.js'

injectShell()

// Rotating café specials
const specials = [
  'Catnip Cold Brew',
  'Espresso Tabby',
  'Meow-chiato',
  'Purrfetto Latte',
  'Hiss-presso Shot',
  'Double Tabby Flat White',
  'Caramel Claw Macchiato',
]
let specialIdx = 0
const specialEl = document.getElementById('specialText')
function cycleSpecial() {
  specialEl.style.opacity = '0'
  setTimeout(() => {
    specialIdx = (specialIdx + 1) % specials.length
    specialEl.textContent = specials[specialIdx]
    specialEl.style.transition = 'opacity 0.6s'
    specialEl.style.opacity = '1'
  }, 300)
}
specialEl.textContent = specials[0]
specialEl.style.transition = 'opacity 0.6s'
setInterval(cycleSpecial, 3000)

// Easter egg: click hero cat 7 times
let clicks = 0
const heroCat = document.getElementById('heroCat')
heroCat.addEventListener('click', () => {
  clicks++
  if (clicks === 3) showToast('👀 Hmm...')
  if (clicks === 5) showToast('🐱 The cat is watching...')
  if (clicks === 7) {
    setState('menuUnlocked', true)
    showToast('🎉 Secret found! Redirecting...')
    setTimeout(() => { window.location.href = '/menu' }, 1200)
  }
})

// If menu already unlocked, update mystery card
if (getState('menuUnlocked')) {
  const card = document.getElementById('mysteryCard')
  card.innerHTML = `
    <div class="game-emoji">🗺️</div>
    <h3>Secret Menu</h3>
    <p>You've discovered the hidden café menu. Come back anytime, regular.</p>
    <span class="badge badge-gold">🔓 Unlocked</span>`
  card.style.cursor = 'pointer'
  card.addEventListener('click', () => window.location.href = '/menu')
} else {
  document.getElementById('mysteryCard').addEventListener('click', () => {
    showToast('🐾 Try clicking the cat on this page...')
  })
}
