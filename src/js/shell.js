import { initNav } from './nav.js'

export function injectShell() {
  // Nav
  const nav = document.createElement('header')
  nav.innerHTML = `
    <nav class="site-nav">
      <div class="nav-inner">
        <a href="/" class="nav-logo">☕ Purring<span>Cup</span></a>
        <button class="nav-toggle" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-links">
          <a href="/">Home</a>
          <a href="/clicker">Cat Clicker</a>
          <a href="/memory">Memory Cards</a>
          <a href="/rhythm">Pour Rhythm</a>
          <a href="/trivia">Trivia</a>
          <a href="/runner">Cat Runner</a>
          <a href="/about">About</a>
        </div>
      </div>
    </nav>`
  document.body.prepend(nav)

  // Footer
  const footer = document.createElement('footer')
  footer.className = 'site-footer'
  footer.innerHTML = `
    <div class="ascii-cat">=^..^= ☕</div>
    <p>The Purring Cup Café · 1 Whisker Lane · Est. 2024</p>
    <p style="margin-top:0.5rem">Made with love, caffeine, and cat hair.</p>`
  document.body.append(footer)

  initNav()
}

export function showToast(msg, duration = 2500) {
  let t = document.querySelector('.toast')
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.append(t) }
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), duration)
}
