import { getState, setState } from '../storage.js'
import { sfx } from '../sfx.js'

const canvas  = document.getElementById('runnerCanvas')
const ctx     = canvas.getContext('2d')
const overlay = document.getElementById('runnerOverlay')
const startBtn= document.getElementById('runnerStartBtn')
const scoreEl = document.getElementById('runnerScore')
const bestEl  = document.getElementById('runnerBest')
const beansEl = document.getElementById('runnerBeans')
const scoreListEl = document.getElementById('scoreList')

// Canvas sizing
const W = 800, H = 220
canvas.width  = W
canvas.height = H

const GROUND = H - 30
const GRAVITY = 1800
const JUMP_V  = -700

// Game state
let running = false, started = false
let score = 0, beans = 0
let speed = 280  // px/sec
let spawnTimer = 0
let nextSpawn  = 1.5

// Cat
const cat = { x: 90, y: GROUND, vy: 0, w: 38, h: 38, frame: 0, frameTimer: 0, jumping: false, dead: false }

// Objects
let obstacles = []
let collectibles = []

// Clouds
let clouds = [
  { x: 150, y: 20, w: 80 },
  { x: 450, y: 40, w: 60 },
  { x: 680, y: 15, w: 90 },
]

// Input
let jumpHeld = false, jumpPressed = false
document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); onJumpPress() } })
document.addEventListener('keyup',   e => { if (e.code === 'Space') jumpHeld = false })
document.getElementById('canvasWrap').addEventListener('pointerdown', e => { e.preventDefault(); onJumpPress() })
document.getElementById('canvasWrap').addEventListener('pointerup',   e => jumpHeld = false)

function onJumpPress() {
  if (!started) { beginGame(); return }
  if (cat.dead) { restartGame(); return }
  if (!cat.jumping) {
    cat.vy = JUMP_V
    cat.jumping = true
    sfx.jump()
  }
  jumpHeld = true
}

startBtn.addEventListener('click', beginGame)

function beginGame() {
  overlay.style.display = 'none'
  started = true
  restartGame()
}

function restartGame() {
  score = 0; beans = 0; speed = 280
  obstacles = []; collectibles = []
  spawnTimer = 0; nextSpawn = 1.5
  Object.assign(cat, { y: GROUND, vy: 0, frame: 0, frameTimer: 0, jumping: false, dead: false })
  running = true
  lastTime = null
  scoreEl.textContent = 0
  beansEl.textContent = 0
  requestAnimationFrame(gameLoop)
}

function spawnObstacle() {
  const type = Math.random() < 0.6 ? 'cup' : 'dog'
  obstacles.push({
    x: W + 20, y: GROUND,
    w: type === 'cup' ? 28 : 42,
    h: type === 'cup' ? 38 : 30,
    type
  })
}

function spawnBean() {
  collectibles.push({ x: W + 20, y: GROUND - 50 - Math.random() * 40, w: 18, h: 18 })
}

let lastTime = null
function gameLoop(ts) {
  if (!running) return
  if (!lastTime) { lastTime = ts }
  let dt = Math.min((ts - lastTime) / 1000, 0.05)
  lastTime = ts

  // Speed ramp
  speed = 280 + score * 0.08

  // Physics
  cat.vy += GRAVITY * dt
  if (jumpHeld && cat.jumping && cat.vy > -200) cat.vy -= 600 * dt
  cat.y += cat.vy * dt
  if (cat.y >= GROUND) { cat.y = GROUND; cat.vy = 0; cat.jumping = false }

  // Animation frame
  cat.frameTimer += dt
  if (cat.frameTimer > 0.1) { cat.frame = (cat.frame + 1) % 3; cat.frameTimer = 0 }

  // Spawn
  spawnTimer += dt
  if (spawnTimer >= nextSpawn) {
    spawnObstacle()
    if (Math.random() < 0.4) spawnBean()
    nextSpawn = 1.0 + Math.random() * 1.2 - Math.min(score * 0.002, 0.5)
    spawnTimer = 0
  }

  // Move obstacles
  obstacles = obstacles.filter(o => {
    o.x -= speed * dt
    return o.x > -60
  })

  // Move beans
  collectibles = collectibles.filter(b => {
    b.x -= speed * dt
    if (overlap(cat, b)) { beans++; beansEl.textContent = beans; sfx.match(); return false }
    return b.x > -30
  })

  // Collision
  for (const o of obstacles) {
    if (overlap(cat, o, 6)) { die(); return }
  }

  score += dt * 10
  scoreEl.textContent = Math.floor(score)

  // Clouds
  clouds.forEach(c => { c.x -= 30 * dt; if (c.x < -100) c.x = W + 20 })

  draw()
  requestAnimationFrame(gameLoop)
}

function overlap(a, b, shrink = 0) {
  const ax = a.x - a.w/2 + shrink, ay = a.y - a.h + shrink
  const bx = b.x - b.w/2 + shrink, by = b.y - b.h + shrink
  return ax < bx + b.w - shrink*2 && ax + a.w - shrink*2 > bx &&
         ay < by + b.h - shrink*2 && ay + a.h - shrink*2 > by
}

function die() {
  running = false
  cat.dead = true
  sfx.die()

  const final = Math.floor(score)
  const prev = getState('runner_scores', [])
  const entry = { score: final, beans, date: new Date().toLocaleDateString() }
  const updated = [entry, ...prev].sort((a,b) => b.score - a.score).slice(0, 5)
  setState('runner_scores', updated)
  bestEl.textContent = updated[0].score
  renderScores(updated)

  draw()
  setTimeout(() => {
    const title  = document.getElementById('overlayTitle')
    const msg    = document.getElementById('overlayMsg')
    const emoji  = document.getElementById('overlayEmoji')
    const btn    = document.getElementById('runnerStartBtn')
    emoji.textContent = '😿'
    title.textContent = 'Oops!'
    msg.innerHTML = `Score: <strong>${final}</strong> &nbsp;|&nbsp; Beans: <strong>${beans}</strong><br>Press Space or tap to try again.`
    btn.textContent = 'Run Again ➜'
    overlay.style.display = 'flex'
  }, 600)
}

function renderScores(list) {
  scoreListEl.innerHTML = list.map((s,i) =>
    `<li><span>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'  '} ${s.date}</span><span>${s.score} pts · ${s.beans}☕</span></li>`
  ).join('')
}

// Draw
function draw() {
  ctx.clearRect(0, 0, W, H)

  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,0,GROUND)
  sky.addColorStop(0, '#e8d5c0')
  sky.addColorStop(1, '#f5e6d3')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  clouds.forEach(c => {
    ctx.beginPath()
    ctx.ellipse(c.x, c.y, c.w/2, 18, 0, 0, Math.PI*2)
    ctx.ellipse(c.x + c.w*0.2, c.y - 10, c.w*0.35, 14, 0, 0, Math.PI*2)
    ctx.fill()
  })

  // Ground
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(0, GROUND, W, H - GROUND)
  ctx.fillStyle = '#a0832a'
  ctx.fillRect(0, GROUND, W, 4)

  // Ground tiles
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, GROUND+4); ctx.lineTo(x, H); ctx.stroke() }

  // Coffee bean collectibles
  collectibles.forEach(b => {
    ctx.fillStyle = '#5c3317'
    ctx.beginPath()
    ctx.ellipse(b.x, b.y, 9, 7, Math.PI/6, 0, Math.PI*2)
    ctx.fill()
    ctx.strokeStyle = '#3E1F00'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(b.x - 4, b.y)
    ctx.bezierCurveTo(b.x - 2, b.y - 4, b.x + 2, b.y - 4, b.x + 4, b.y)
    ctx.stroke()
  })

  // Obstacles
  obstacles.forEach(o => {
    if (o.type === 'cup') {
      // Coffee cup
      ctx.fillStyle = '#7B4F2E'
      ctx.beginPath()
      ctx.moveTo(o.x - o.w/2, o.y - o.h)
      ctx.lineTo(o.x - o.w/2 + 4, o.y)
      ctx.lineTo(o.x + o.w/2 - 4, o.y)
      ctx.lineTo(o.x + o.w/2, o.y - o.h)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#C8A882'
      ctx.fillRect(o.x - o.w/2, o.y - o.h, o.w, 7)
      // handle
      ctx.strokeStyle = '#7B4F2E'; ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(o.x + o.w/2 + 5, o.y - o.h/2, 8, -Math.PI/2, Math.PI/2)
      ctx.stroke()
    } else {
      // Dog (simple sleeping blob)
      ctx.fillStyle = '#c4a882'
      ctx.beginPath()
      ctx.ellipse(o.x, o.y - 12, o.w/2, 14, 0, 0, Math.PI*2)
      ctx.fill()
      ctx.fillStyle = '#a08060'
      ctx.beginPath()
      ctx.ellipse(o.x + o.w/2 - 8, o.y - 20, 12, 10, Math.PI/6, 0, Math.PI*2)
      ctx.fill()
      ctx.fillStyle = '#3E1F00'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText('z z', o.x + 12, o.y - 30)
    }
  })

  // Cat
  drawCat(cat.x, cat.y, cat.frame, cat.dead)
}

function drawCat(x, y, frame, dead) {
  const leg = dead ? 0 : (frame === 1 ? 6 : frame === 2 ? -4 : 0)
  ctx.save()
  if (dead) { ctx.translate(x, y - 19); ctx.rotate(Math.PI/2) }
  else ctx.translate(x, y)

  // Body
  ctx.fillStyle = '#888080'
  ctx.beginPath()
  ctx.ellipse(0, -19, 16, 13, 0, 0, Math.PI*2)
  ctx.fill()

  // Head
  ctx.fillStyle = '#999090'
  ctx.beginPath()
  ctx.arc(0, -38, 13, 0, Math.PI*2)
  ctx.fill()

  // Ears
  ctx.fillStyle = '#888080'
  ;[[-9,-50],[ 9,-50]].forEach(([ex, ey]) => {
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex-6, ey-10); ctx.lineTo(ex+6, ey-10); ctx.closePath(); ctx.fill()
  })

  // Eyes
  ctx.fillStyle = dead ? '#FF6B6B' : '#FFD700'
  ;[[-5,-40],[5,-40]].forEach(([ex,ey]) => {
    ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath(); ctx.arc(ex + (dead?0:0.5), ey, dead?3:1.5, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = dead ? '#FF6B6B' : '#FFD700'
  })

  // Nose
  ctx.fillStyle = '#FFB6C1'
  ctx.beginPath(); ctx.arc(0, -35, 2, 0, Math.PI*2); ctx.fill()

  // Tail
  ctx.strokeStyle = '#888080'; ctx.lineWidth = 4; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(14, -16)
  ctx.bezierCurveTo(30, -16, 30, -5 + (dead?0:Math.sin(frame*2)*4), 20, -2)
  ctx.stroke()

  // Legs (animated)
  if (!dead) {
    ctx.strokeStyle = '#777070'; ctx.lineWidth = 5
    ;[[-8,leg],[8,-leg]].forEach(([lx,ly]) => {
      ctx.beginPath(); ctx.moveTo(lx, -8); ctx.lineTo(lx + ly*0.5, 0); ctx.stroke()
    })
  }

  ctx.restore()
}

// Load existing scores
const existingScores = getState('runner_scores', [])
if (existingScores.length) {
  bestEl.textContent = existingScores[0].score
  renderScores(existingScores)
}

// Pause on tab hidden
document.addEventListener('visibilitychange', () => { if (document.hidden) running = false })

// Draw initial static frame
draw()
requestAnimationFrame(ts => { lastTime = ts })
