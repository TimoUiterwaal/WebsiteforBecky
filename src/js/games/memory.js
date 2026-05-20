import { getState, setState } from '../storage.js'
import { sfx } from '../sfx.js'

const EASY_PAIRS = ['🐟','☕','🐾','🫘','😺','🧋','🐈','🍵']
const HARD_EXTRA  = ['😸','🌿','🐈‍⬛','🥐']

let difficulty = 'easy'
let cards = []
let flipped = []
let matched = new Set()
let flipCount = 0
let pairCount = 0
let startTime = null
let timerInterval = null
let locked = false

const grid      = document.getElementById('memoryGrid')
const flipEl    = document.getElementById('flipCount')
const pairEl    = document.getElementById('pairCount')
const totalEl   = document.getElementById('pairTotal')
const timerEl   = document.getElementById('timer')
const winEl     = document.getElementById('memoryWin')
const winMsg    = document.getElementById('winMsg')
const bestEl    = document.getElementById('bestScore')
const newBtn    = document.getElementById('newGameBtn')
const againBtn  = document.getElementById('playAgainBtn')

document.querySelectorAll('[data-diff]').forEach(btn => {
  btn.addEventListener('click', () => {
    difficulty = btn.dataset.diff
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    startGame()
  })
})
document.querySelector('[data-diff="easy"]').classList.add('active')

newBtn.addEventListener('click', startGame)
againBtn.addEventListener('click', () => { winEl.style.display = 'none'; startGame() })

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function startGame() {
  clearInterval(timerInterval)
  flipped = []; matched = new Set(); flipCount = 0; pairCount = 0; locked = false; startTime = null
  grid.className = 'memory-grid ' + difficulty

  const pairs = difficulty === 'hard' ? [...EASY_PAIRS, ...HARD_EXTRA] : EASY_PAIRS
  totalEl.textContent = pairs.length
  cards = shuffle([...pairs, ...pairs])

  grid.innerHTML = ''
  cards.forEach((emoji, i) => {
    const card = document.createElement('div')
    card.className = 'mem-card'
    card.dataset.index = i
    card.dataset.emoji = emoji
    card.innerHTML = `
      <div class="card-face card-back">🐾</div>
      <div class="card-face card-front">${emoji}</div>`
    card.addEventListener('click', () => onCardClick(card))
    grid.append(card)
  })

  updateStats()
}

function onCardClick(card) {
  if (locked) return
  if (matched.has(card.dataset.index)) return
  if (flipped.includes(card)) return

  if (!startTime) {
    startTime = Date.now()
    timerInterval = setInterval(updateTimer, 500)
  }

  card.classList.add('flipped')
  flipped.push(card)
  sfx.click()

  if (flipped.length === 2) {
    flipCount++
    updateStats()
    locked = true
    const [a, b] = flipped
    if (a.dataset.emoji === b.dataset.emoji) {
      matched.add(a.dataset.index)
      matched.add(b.dataset.index)
      a.classList.add('matched')
      b.classList.add('matched')
      pairCount++
      sfx.match()
      flipped = []
      locked = false
      updateStats()
      const total = difficulty === 'hard' ? EASY_PAIRS.length + HARD_EXTRA.length : EASY_PAIRS.length
      if (pairCount === total) showWin(total)
    } else {
      sfx.wrong()
      setTimeout(() => {
        a.classList.remove('flipped')
        b.classList.remove('flipped')
        flipped = []
        locked = false
      }, 850)
    }
  }
}

function updateStats() {
  flipEl.textContent = flipCount
  pairEl.textContent = pairCount
}

function updateTimer() {
  if (!startTime) return
  timerEl.textContent = Math.floor((Date.now() - startTime) / 1000) + 's'
}

function showWin(total) {
  clearInterval(timerInterval)
  const elapsed = Math.floor((Date.now() - startTime) / 1000)
  const key = `memory_best_${difficulty}`
  const prev = getState(key, null)
  const isNew = !prev || flipCount < prev.flips
  if (isNew) setState(key, { flips: flipCount, time: elapsed })
  const best = getState(key)

  winMsg.textContent = `You matched all ${total} pairs in ${flipCount} flips and ${elapsed}s!`
  bestEl.textContent = `Best: ${best.flips} flips · ${best.time}s`
  if (isNew) bestEl.textContent = '🌟 New best! ' + bestEl.textContent
  winEl.style.display = 'flex'
  sfx.correct()
}

startGame()
