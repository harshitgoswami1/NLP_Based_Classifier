import './style.css'

const examples = [
  { label: 'Account warning', text: 'Your account has been locked. Click this link and enter your password to restore access.' },
  { label: 'Prize offer', text: 'Congratulations! You have won a free phone. Claim your prize by filling in your details now.' },
  { label: 'Everyday message', text: 'Hi, can we meet for lunch tomorrow? Let me know what time works for you.' },
]

const displayName = (category) => category === 'NOT-Malicious General Class' ? 'Benign' : category
const descriptions = {
  Baiting: 'An enticing offer may be used to draw someone into a harmful action.',
  Malware: 'The message resembles attempts to deliver or install harmful software.',
  Phishing: 'The message resembles attempts to obtain sensitive information.',
  Pretexting: 'The message may use a fabricated situation to gain trust or information.',
  Scareware: 'The message may use fear or urgency to push an action.',
  'NOT-Malicious General Class': 'The message most closely resembles ordinary, non-malicious text.',
}

document.querySelector('#app').innerHTML = `
  <div class="page-shell">
    <header class="site-header">
      <div class="brand"><span class="brand-mark" aria-hidden="true"><span></span></span><span>Cyberguard</span></div>
      <span id="api-status" class="api-status">Checking service</span>
    </header>

    <main>
      <section class="workspace" aria-labelledby="page-title">
        <div class="workspace-heading">
          <h1 id="page-title">Analyze a message</h1>
          <p>Paste an email, SMS, or chat message to see which category its wording most closely matches.</p>
        </div>
        <form id="analysis-form">
          <label for="message">Message text</label>
          <textarea id="message" name="message" maxlength="10000" placeholder="Paste the message you want to check here…" required></textarea>
          <div class="input-footer"><span>Try an example</span><div class="examples">${examples.map((example, index) => `<button type="button" class="example" data-example="${index}">${example.label}</button>`).join('')}</div></div>
          <div class="form-footer"><span id="input-count">0 / 10,000 characters</span><button id="analyze-button" class="primary-button" type="submit">Analyze message <span aria-hidden="true">↗</span></button></div>
        </form>
        <div id="feedback" class="feedback" role="status" aria-live="polite" hidden></div>
        <section id="result" class="result" aria-live="polite" hidden>
          <div class="result-main"><div><p class="result-kicker">Closest match</p><h3 id="result-category"></h3><p id="result-description"></p></div><div class="result-score"><strong id="result-percent"></strong><span>model score</span></div></div>
          <div class="score-heading"><h4>How the categories compare</h4><span>Higher means closer match</span></div>
          <div id="score-list" class="score-list"></div>
          <p class="result-note">These scores are model estimates, not a safety verdict. Check links, senders, and requests before acting.</p>
        </section>
      </section>

      <aside class="scope-note"><span class="scope-icon" aria-hidden="true">i</span><p>This tool reads message wording. It cannot inspect links, attachments, sender identity, or device activity.</p></aside>
    </main>
    <footer class="site-footer"><span>Cyberguard</span><span>Text classification from a trained language model</span></footer>
  </div>
`

const form = document.querySelector('#analysis-form')
const input = document.querySelector('#message')
const feedback = document.querySelector('#feedback')
const result = document.querySelector('#result')
const button = document.querySelector('#analyze-button')

input.addEventListener('input', () => {
  document.querySelector('#input-count').textContent = `${input.value.length.toLocaleString()} / 10,000 characters`
})

document.querySelectorAll('[data-example]').forEach((exampleButton) => {
  exampleButton.addEventListener('click', () => {
    input.value = examples[Number(exampleButton.dataset.example)].text
    input.dispatchEvent(new Event('input'))
    input.focus()
  })
})

fetch('/api/health')
  .then((response) => { if (!response.ok) throw new Error(); return response.json() })
  .then(() => { document.querySelector('#api-status').textContent = 'Service ready'; document.querySelector('#api-status').classList.add('ready') })
  .catch(() => { document.querySelector('#api-status').textContent = 'Service offline' })

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const text = input.value.trim()
  if (!text) {
    feedback.textContent = 'Enter a message to analyze.'
    feedback.hidden = false
    input.focus()
    return
  }

  button.disabled = true
  button.textContent = 'Analyzing…'
  feedback.hidden = true
  result.hidden = true

  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) throw new Error('Analysis could not complete. Check that the backend is running and try again.')
    const prediction = await response.json()
    const benign = prediction.category === 'NOT-Malicious General Class'
    result.classList.toggle('benign', benign)
    document.querySelector('#result-category').textContent = displayName(prediction.category)
    document.querySelector('#result-description').textContent = descriptions[prediction.category] || 'This is the closest matching category.'
    document.querySelector('#result-percent').textContent = `${Math.round(prediction.scores[0].score * 100)}%`
    const scoreList = document.querySelector('#score-list')
    scoreList.replaceChildren(...prediction.scores.map(({ category, score }) => {
      const row = document.createElement('div')
      row.className = 'score-row'
      row.innerHTML = '<span class="score-label"></span><div class="score-track"><span class="score-fill"></span></div><span class="score-value"></span>'
      row.querySelector('.score-label').textContent = displayName(category)
      row.querySelector('.score-fill').style.width = `${Math.max(score * 100, 1)}%`
      row.querySelector('.score-value').textContent = `${Math.round(score * 100)}%`
      return row
    }))
    result.hidden = false
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' })
  } catch (error) {
    feedback.textContent = error.message
    feedback.hidden = false
  } finally {
    button.disabled = false
    button.innerHTML = 'Analyze message <span aria-hidden="true">↗</span>'
  }
})
