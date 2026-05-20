import { injectShell } from '../js/shell.js'
injectShell()

document.getElementById('receiptDate').textContent = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
