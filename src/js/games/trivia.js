import { getState, setState } from '../storage.js'
import { sfx } from '../sfx.js'

const ALL_QUESTIONS = [
  { emoji:'😴', q:'How many hours a day do cats sleep on average?',           opts:['4–6 hours','8–10 hours','12–16 hours','20–22 hours'], correct:2 },
  { emoji:'😺', q:'What is a group of cats called?',                          opts:['A pack','A clowder','A flock','A pride'],             correct:1 },
  { emoji:'☕', q:'Which country consumes the most coffee per capita?',        opts:['Italy','USA','Brazil','Finland'],                     correct:3 },
  { emoji:'🐾', q:'What do cats use whiskers for primarily?',                  opts:['Tasting food','Sensing space & navigation','Hunting prey','Grooming'], correct:1 },
  { emoji:'☕', q:'Espresso is brewed by forcing water through grounds at what pressure?', opts:['3 bar','6 bar','9 bar','15 bar'], correct:2 },
  { emoji:'😽', q:'What is a cat\'s slow blink sometimes called?',             opts:['Cat kiss','Eye wink','Love blink','Slow wave'],       correct:0 },
  { emoji:'🌿', q:'What plant are cats famously attracted to?',                opts:['Basil','Lavender','Catnip','Rosemary'],               correct:2 },
  { emoji:'🫘', q:'Coffee beans are actually the seeds of which fruit?',       opts:['A berry','A nut','A legume','A drupe'],               correct:0 },
  { emoji:'🐈', q:'Cats have how many toes on their front paws (standard)?',   opts:['4','5','6','7'],                                     correct:1 },
  { emoji:'🏆', q:'Which city is said to have the most coffee shops per capita?', opts:['Vienna','Seattle','Helsinki','Melbourne'],         correct:2 },
  { emoji:'😸', q:'A cat\'s purring frequency ranges roughly between:',        opts:['5–15 Hz','25–150 Hz','200–400 Hz','500+ Hz'],        correct:1 },
  { emoji:'☕', q:'What does "lungo" mean in coffee terms?',                   opts:['Double shot','Long shot','Cold brew','Light roast'],   correct:1 },
  { emoji:'🐱', q:'What is the name of the oldest known pet cat?',             opts:['Mittens','Felix','Creme Puff','Grumpy Cat'],          correct:2 },
  { emoji:'🧋', q:'Latte art is created using which technique?',               opts:['Stencils','Free pouring steamed milk','Pipettes','Whipped cream'], correct:1 },
  { emoji:'🐈‍⬛', q:'Black cats are considered lucky in which country?',        opts:['USA','Germany','Japan','France'],                     correct:2 },
  { emoji:'🫖', q:'What does "cortado" mean in Spanish?',                      opts:['Short','Cut (with milk)','Strong','Dark'],            correct:1 },
  { emoji:'😺', q:'Cats are naturally crepuscular, meaning most active at:',   opts:['Midday','Night','Dawn and dusk','Early morning'],     correct:2 },
  { emoji:'☕', q:'The word "coffee" likely derives from which language?',     opts:['Italian','Arabic (qahwa)','Dutch','Turkish'],         correct:1 },
  { emoji:'🐾', q:'How many vertebrae does a cat have (approx)?',              opts:['20','30','45','60'],                                  correct:1 },
  { emoji:'🫘', q:'Robusta coffee beans have approximately how much more caffeine than Arabica?', opts:['Same amount','25% more','Twice as much','10× more'], correct:2 },
]

const GRADES = [
  { min:90, label:'Purrfect Barista',     emoji:'👑', msg:'The café is yours. Wear the golden apron.',          badge:'badge-gold' },
  { min:70, label:'Senior Tabby',         emoji:'😺', msg:'You clearly drink too much coffee. Well done.',       badge:'badge-green' },
  { min:50, label:'Apprentice Cat',       emoji:'😸', msg:'A good start. The senior cats are impressed-ish.',   badge:'' },
  { min:0,  label:'Sleepy Kitten',        emoji:'😴', msg:'You\'re still good. Just... maybe nap less during quizzes.', badge:'' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let questions = [], qIdx = 0, score = 0, timerInterval = null

const startScreen  = document.getElementById('triviaStart')
const gameScreen   = document.getElementById('triviaGame')
const resultScreen = document.getElementById('triviaResult')
const qNumEl       = document.getElementById('qNum')
const scoreEl      = document.getElementById('scoreDisplay')
const timerBarEl   = document.getElementById('timerBar')
const qEmojiEl     = document.getElementById('qEmoji')
const qTextEl      = document.getElementById('questionText')
const answerGrid   = document.getElementById('answerGrid')
const reactionEl   = document.getElementById('reaction')
const resultEmoji  = document.getElementById('resultEmoji')
const resultGrade  = document.getElementById('resultGrade')
const resultMsg    = document.getElementById('resultMsg')
const finalScore   = document.getElementById('finalScore')
const highBadge    = document.getElementById('highScoreBadge')

document.getElementById('triviaStartBtn').addEventListener('click', startGame)
document.getElementById('playAgainTrivia').addEventListener('click', () => { resultScreen.style.display = 'none'; startGame() })

function startGame() {
  questions = shuffle(ALL_QUESTIONS).slice(0, 10)
  qIdx = 0; score = 0
  startScreen.style.display = 'none'
  resultScreen.style.display = 'none'
  gameScreen.style.display = 'flex'
  showQuestion()
}

function showQuestion() {
  if (qIdx >= 10) { endGame(); return }
  const q = questions[qIdx]
  qNumEl.textContent = qIdx + 1
  scoreEl.textContent = `Score: ${score}`
  qEmojiEl.textContent = q.emoji
  qTextEl.textContent = q.q
  reactionEl.style.opacity = '0'
  reactionEl.className = 'reaction'

  // Shuffle answer order
  const opts = q.opts.map((text, i) => ({ text, i }))
  const shuffled = shuffle(opts)

  answerGrid.innerHTML = ''
  shuffled.forEach(({ text, i }) => {
    const btn = document.createElement('button')
    btn.className = 'answer-btn'
    btn.textContent = text
    btn.addEventListener('click', () => handleAnswer(i === q.correct, btn, shuffled, q.correct))
    answerGrid.append(btn)
  })

  // Timer
  clearInterval(timerInterval)
  let timeLeft = 15
  timerBarEl.style.width = '100%'
  timerBarEl.classList.remove('warning')
  timerInterval = setInterval(() => {
    timeLeft--
    timerBarEl.style.width = (timeLeft / 15 * 100) + '%'
    if (timeLeft <= 5) timerBarEl.classList.add('warning')
    if (timeLeft <= 0) { clearInterval(timerInterval); timeOut(shuffled, q.correct) }
  }, 1000)
}

function handleAnswer(isCorrect, clickedBtn, opts, correctIdx) {
  clearInterval(timerInterval)
  disableAnswers()

  // Find the correct button
  const btns = answerGrid.querySelectorAll('.answer-btn')
  btns.forEach((btn, bi) => {
    if (opts[bi].i === correctIdx) btn.classList.add('correct')
  })

  if (isCorrect) {
    clickedBtn.classList.add('correct')
    score += 10
    sfx.correct()
    reactionEl.textContent = '😸 Correct! +10 points'
    reactionEl.className = 'reaction correct'
  } else {
    clickedBtn.classList.add('wrong')
    sfx.wrong()
    reactionEl.textContent = '😾 Wrong! (The cat sighs.)'
    reactionEl.className = 'reaction wrong'
  }
  reactionEl.style.opacity = '1'
  qIdx++
  setTimeout(showQuestion, 1200)
}

function timeOut(opts, correctIdx) {
  disableAnswers()
  const btns = answerGrid.querySelectorAll('.answer-btn')
  btns.forEach((btn, bi) => {
    if (opts[bi].i === correctIdx) btn.classList.add('correct')
  })
  sfx.wrong()
  reactionEl.textContent = '⏱️ Time\'s up! The cat is unimpressed.'
  reactionEl.className = 'reaction wrong'
  reactionEl.style.opacity = '1'
  qIdx++
  setTimeout(showQuestion, 1200)
}

function disableAnswers() {
  answerGrid.querySelectorAll('.answer-btn').forEach(b => b.disabled = true)
}

function endGame() {
  gameScreen.style.display = 'none'
  resultScreen.style.display = 'flex'
  const pct = score
  const grade = GRADES.find(g => pct >= g.min)
  resultEmoji.textContent = grade.emoji
  resultGrade.textContent = grade.label
  resultMsg.textContent = grade.msg
  finalScore.textContent = score + ' / 100'

  const prev = getState('trivia_best', 0)
  if (score > prev) {
    setState('trivia_best', score)
    highBadge.innerHTML = '<span class="badge badge-gold">🌟 New High Score!</span>'
    sfx.prestige()
  } else {
    highBadge.innerHTML = `<span class="badge">Best: ${prev}/100</span>`
    if (score >= 70) sfx.correct()
  }
}
