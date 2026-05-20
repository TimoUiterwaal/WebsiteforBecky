import { sfx } from '../sfx.js'

// Patterns: arrays of [top% position of green zone center] over 10 rounds
const PATTERNS = {
  slow:   [0.6,0.3,0.7,0.5,0.2,0.8,0.4,0.6,0.3,0.7],
  steady: [0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5],
  rush:   [0.8,0.1,0.6,0.3,0.9,0.2,0.7,0.4,0.1,0.8],
}
const SPEEDS = { slow: 0.0015, steady: 0.0025, rush: 0.004 }
const ZONE_H = 80   // px height of green zone
const TRACK_H = 320 // px height of track

let pattern    = 'slow'
let round      = 0
let fillLevel  = 0  // 0–100
let animId     = null
let markerY    = 0  // 0–1 normalised
let markerDir  = 1
let zoneCenter = 0.5
let markerSpeed= SPEEDS.slow
let inputEnabled = false

// DOM
const startScreen  = document.getElementById('startScreen')
const gameScreen   = document.getElementById('gameScreen')
const resultScreen = document.getElementById('resultScreen')
const roundNumEl   = document.getElementById('roundNum')
const fillPctEl    = document.getElementById('fillPct')
const lastResultEl = document.getElementById('lastResult')
const markerEl     = document.getElementById('streamMarker')
const zoneEl       = document.getElementById('greenZone')
const cupFill      = document.getElementById('cupFill')
const latteArt     = document.getElementById('latte-art')
const resultEmoji  = document.getElementById('resultEmoji')
const resultTitle  = document.getElementById('resultTitle')
const resultMsg    = document.getElementById('resultMsg')

document.getElementById('startBtn').addEventListener('click', startGame)
document.getElementById('retryBtn').addEventListener('click', resetToStart)
document.querySelectorAll('.pattern-btn').forEach(b => {
  b.addEventListener('click', () => {
    pattern = b.dataset.pattern
    document.querySelectorAll('.pattern-btn').forEach(x => x.classList.remove('active'))
    b.classList.add('active')
  })
})

document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); handleInput() } })
document.getElementById('rhythmStage')?.addEventListener('click', handleInput)

function startGame() {
  round = 0; fillLevel = 0; markerY = 0; markerDir = 1
  markerSpeed = SPEEDS[pattern]
  startScreen.style.display = 'none'
  resultScreen.style.display = 'none'
  gameScreen.style.display = 'flex'
  nextRound()
}

function nextRound() {
  if (round >= 10) { endGame(); return }
  zoneCenter = PATTERNS[pattern][round]
  roundNumEl.textContent = round + 1
  fillPctEl.textContent = Math.floor(fillLevel) + '%'
  lastResultEl.textContent = ''
  lastResultEl.className = 'result-badge'
  updateCupFill()

  // Position green zone
  const zonePx = zoneCenter * TRACK_H - ZONE_H / 2
  zoneEl.style.top = Math.max(0, Math.min(TRACK_H - ZONE_H, zonePx)) + 'px'

  inputEnabled = true
  round++
  animate()
}

function animate() {
  cancelAnimationFrame(animId)
  let last = null
  function loop(ts) {
    if (!last) last = ts
    const delta = ts - last; last = ts
    markerY += markerDir * markerSpeed * delta
    if (markerY >= 1) { markerY = 1; markerDir = -1 }
    if (markerY <= 0) { markerY = 0; markerDir = 1 }
    const px = markerY * (TRACK_H - 20)
    markerEl.style.top = px + 'px'
    const inZone = Math.abs(markerY - zoneCenter) < (ZONE_H / 2 / TRACK_H)
    markerEl.classList.toggle('in-zone', inZone)
    if (inputEnabled) animId = requestAnimationFrame(loop)
  }
  animId = requestAnimationFrame(loop)
}

function handleInput() {
  if (!inputEnabled) return
  inputEnabled = false
  cancelAnimationFrame(animId)

  const offset = Math.abs(markerY - zoneCenter)
  const zoneRatio = ZONE_H / 2 / TRACK_H
  let result, fillGain

  if (offset < zoneRatio * 0.3) {
    result = 'PERFECT! ⭐'; fillGain = 12; lastResultEl.className = 'result-badge perfect'; sfx.correct()
  } else if (offset < zoneRatio) {
    result = 'Good ✓';      fillGain = 8;  lastResultEl.className = 'result-badge good';    sfx.match()
  } else {
    result = 'Miss ✗';      fillGain = -10; lastResultEl.className = 'result-badge miss';   sfx.wrong()
    splatterEffect()
  }

  fillLevel = Math.max(0, Math.min(100, fillLevel + fillGain))
  lastResultEl.textContent = result
  fillPctEl.textContent = Math.floor(fillLevel) + '%'
  updateCupFill()

  setTimeout(nextRound, 700)
}

function updateCupFill() {
  const maxH = 115
  const h = (fillLevel / 100) * maxH
  cupFill.setAttribute('y', 125 - h)
  cupFill.setAttribute('height', h)
}

function splatterEffect() {
  const stage = document.getElementById('rhythmStage')
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement('div')
    dot.style.cssText = `
      position:absolute; width:8px; height:8px; border-radius:50%;
      background:var(--color-caramel); pointer-events:none;
      left:${30 + Math.random()*40}%; top:${40+Math.random()*40}%;
      animation: fadeOut 0.6s forwards;`
    stage.appendChild(dot)
    setTimeout(() => dot.remove(), 700)
  }
}

function endGame() {
  gameScreen.style.display = 'none'
  resultScreen.style.display = 'flex'
  const pct = Math.floor(fillLevel)

  if (fillLevel >= 70) {
    resultEmoji.textContent = '😺'
    resultTitle.textContent = 'Purrfect Pour!'
    resultMsg.textContent = `You filled the cup to ${pct}%! The cat approves.`
    latteArt.style.display = 'flex'
    sfx.prestige()
  } else {
    resultEmoji.textContent = '😿'
    resultTitle.textContent = 'Spilled it...'
    resultMsg.textContent = `Only ${pct}% filled. The cat is disappointed. Very disappointed.`
    latteArt.style.display = 'none'
    sfx.die()
  }
}

function resetToStart() {
  resultScreen.style.display = 'none'
  startScreen.style.display = 'flex'
}

// Inject fadeOut keyframe dynamically
const style = document.createElement('style')
style.textContent = '@keyframes fadeOut { to { opacity:0; transform: translate(var(--dx,10px), var(--dy,-15px)) scale(0); } }'
document.head.append(style)
