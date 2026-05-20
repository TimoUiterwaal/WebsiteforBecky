import { getState, setState } from '../storage.js'
import { sfx } from '../sfx.js'
import { showToast } from '../shell.js'

const SAVE_KEY = 'clicker_state'

const UPGRADES = [
  { id: 'paw',       icon: '🐾', name: 'Extra Paw',            desc: 'A spare paw for clicking. Efficiency!',             bps: 0.1, baseCost: 15 },
  { id: 'drip',      icon: '💧', name: 'Drip Machine',          desc: 'Slowly drips coffee while you nap.',                bps: 0.5, baseCost: 100 },
  { id: 'kitten',    icon: '🐱', name: 'Apprentice Kitten',     desc: 'Knocks cups off counters. Mostly useful.',          bps: 2,   baseCost: 500 },
  { id: 'espresso',  icon: '☕', name: 'Espresso Machine',      desc: 'Proper equipment for a proper cat café.',           bps: 8,   baseCost: 2000 },
  { id: 'barista',   icon: '👨‍🍳', name: 'Barista Tabby',         desc: 'Certified. Opinionated about your order.',         bps: 25,  baseCost: 8000 },
  { id: 'roastery',  icon: '🏭', name: 'Cat Roastery',          desc: 'Industrial-scale bean production. Very loud.',      bps: 80,  baseCost: 30000 },
  { id: 'catnip',    icon: '🌿', name: 'Catnip Reactor',        desc: 'Powers the whole café on pure catnip energy.',      bps: 250, baseCost: 100000 },
  { id: 'dimension', icon: '🌀', name: 'Bean Dimension',        desc: 'Harvests coffee from a parallel universe.',         bps: 1000,baseCost: 500000 },
]

function costFor(upgrade, count) {
  return Math.floor(upgrade.baseCost * Math.pow(1.15, count))
}

let state = getState(SAVE_KEY, {
  beans: 0,
  totalBeans: 0,
  counts: {},
  prestigeCount: 0,
  lastSave: Date.now(),
})

// Offline accumulation
const offlineSeconds = Math.min((Date.now() - (state.lastSave || Date.now())) / 1000, 3600)
if (offlineSeconds > 5) {
  const bps = computeBPS()
  const earned = Math.floor(bps * offlineSeconds)
  if (earned > 0) {
    state.beans += earned
    state.totalBeans += earned
    setTimeout(() => showToast(`☕ You earned ${earned} beans while away!`), 1000)
  }
}

function computeBPS() {
  return UPGRADES.reduce((sum, u) => sum + u.bps * (state.counts[u.id] || 0), 0)
}

function save() {
  state.lastSave = Date.now()
  setState(SAVE_KEY, state)
}

// DOM refs
const beanCountEl = document.getElementById('beanCount')
const bpsEl       = document.getElementById('bpsDisplay')
const shopList    = document.getElementById('shopList')
const clickBtn    = document.getElementById('clickCat')
const prestigeWrap= document.getElementById('prestigeWrap')
const prestigeBtn = document.getElementById('prestigeBtn')
const badgesEl    = document.getElementById('badges')

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toLocaleString()
}

function renderShop() {
  shopList.innerHTML = ''
  UPGRADES.forEach(u => {
    const count = state.counts[u.id] || 0
    const cost  = costFor(u, count)
    const canAfford = state.beans >= cost
    const div = document.createElement('div')
    div.className = 'shop-item' + (canAfford ? '' : ' disabled')
    div.innerHTML = `
      <span class="shop-icon">${u.icon}</span>
      <div class="shop-info">
        <div class="shop-name">${u.name}</div>
        <div class="shop-desc">${u.desc}</div>
        <div class="shop-meta">+${u.bps}/sec each</div>
      </div>
      <div class="shop-cost">☕ ${fmt(cost)}</div>
      <div class="shop-count">${count}</div>`
    div.addEventListener('click', () => {
      if (state.beans < cost) return
      state.beans -= cost
      state.counts[u.id] = (state.counts[u.id] || 0) + 1
      sfx.click()
      save()
      renderShop()
      updateUI()
    })
    shopList.append(div)
  })
}

function renderBadges() {
  badgesEl.innerHTML = ''
  for (let i = 0; i < (state.prestigeCount || 0); i++) {
    const b = document.createElement('span')
    b.className = 'badge badge-gold'
    b.textContent = '🐾 Golden Paw'
    badgesEl.append(b)
  }
}

function updateUI() {
  beanCountEl.textContent = fmt(state.beans)
  const bps = computeBPS()
  bpsEl.textContent = `${bps.toFixed(1)} beans/sec`
  prestigeWrap.style.display = state.totalBeans >= 10000 ? 'block' : 'none'
  // Update shop affordability without rebuilding the list
  shopList.querySelectorAll('.shop-item').forEach((el, i) => {
    const cost = costFor(UPGRADES[i], state.counts[UPGRADES[i].id] || 0)
    el.classList.toggle('disabled', state.beans < cost)
  })
}

// Click handler
clickBtn.addEventListener('click', e => {
  state.beans++
  state.totalBeans++
  sfx.click()

  // Float text
  const el = document.createElement('span')
  el.className = 'float-text'
  el.textContent = '+1 ☕'
  el.style.left = e.clientX + 'px'
  el.style.top  = e.clientY + 'px'
  document.body.append(el)
  el.addEventListener('animationend', () => el.remove())

  // Button click animation
  clickBtn.classList.add('clicking')
  setTimeout(() => clickBtn.classList.remove('clicking'), 100)

  updateUI()
  save()
})

// Prestige
prestigeBtn.addEventListener('click', () => {
  if (state.totalBeans < 10000) return
  state.prestigeCount = (state.prestigeCount || 0) + 1
  const prevTotal = state.totalBeans
  state.beans = 0
  state.totalBeans = 0
  state.counts = {}
  sfx.prestige()
  showToast('✨ Prestige! You earned a Golden Paw!')
  save()
  renderShop()
  renderBadges()
  updateUI()
})

// Game loop
let lastTick = Date.now()
function tick() {
  const now = Date.now()
  const delta = (now - lastTick) / 1000
  lastTick = now
  const bps = computeBPS()
  if (bps > 0) {
    state.beans += bps * delta
    state.totalBeans += bps * delta
    updateUI()
  }
  requestAnimationFrame(tick)
}

// Save every 5 seconds
setInterval(save, 5000)

// Restore on focus (offline beans)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) lastTick = Date.now()
})

renderShop()
renderBadges()
updateUI()
requestAnimationFrame(tick)
