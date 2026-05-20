let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function tone(freq, duration, type = 'sine', gain = 0.15, delay = 0) {
  const c = getCtx()
  const osc = c.createOscillator()
  const g   = c.createGain()
  osc.connect(g)
  g.connect(c.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime + delay)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.8, c.currentTime + delay + duration)
  g.gain.setValueAtTime(gain, c.currentTime + delay)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration)
  osc.start(c.currentTime + delay)
  osc.stop(c.currentTime + delay + duration)
}

export const sfx = {
  click()   { tone(440, 0.1, 'sine', 0.12) },
  match()   { tone(523, 0.15, 'sine', 0.15); tone(659, 0.15, 'sine', 0.15, 0.15) },
  correct() { [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'sine', 0.15, i * 0.1)) },
  wrong()   { tone(220, 0.25, 'sawtooth', 0.1) },
  jump()    { tone(330, 0.08, 'square', 0.08); tone(440, 0.08, 'square', 0.08, 0.08) },
  die()     { [440, 330, 220].forEach((f, i) => tone(f, 0.15, 'sawtooth', 0.12, i * 0.12)) },
  prestige(){ [392, 494, 587, 784].forEach((f, i) => tone(f, 0.2, 'sine', 0.18, i * 0.15)) },
}
