export function initNav() {
  const toggle = document.querySelector('.nav-toggle')
  const links  = document.querySelector('.nav-links')

  toggle?.addEventListener('click', () => links.classList.toggle('open'))

  // Mark active link
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = new URL(a.href).pathname.replace(/\/$/, '') || '/'
    if (href === path) a.classList.add('active')
  })
}
