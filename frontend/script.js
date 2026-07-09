// ── State ─────────────────────────────────────────────────────────────
let storedAnalysis = null;
let storedCode     = null;
let editor         = null;

// ── Language maps ──────────────────────────────────────────────────────
const CM_MODE = {
  python:     'python',
  javascript: 'javascript',
  java:       'text/x-java',
  cpp:        'text/x-c++src',
  typescript: 'javascript',
};

const PRISM_LANG = {
  python:     'python',
  javascript: 'javascript',
  java:       'java',
  cpp:        'cpp',
  typescript: 'typescript',
};

// ── Init ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

  // CodeMirror — Tomorrow Night colours via custom theme name
  editor = CodeMirror.fromTextArea(document.getElementById('code-input'), {
    theme:          'tomorrow-night',
    lineNumbers:    true,
    indentUnit:     4,
    tabSize:        4,
    indentWithTabs: false,
    lineWrapping:   false,
    autofocus:      true,
    placeholder:    'Paste your code here...',
  });

  // Sync mode with language select
  document.getElementById('language').addEventListener('change', function () {
    editor.setOption('mode', CM_MODE[this.value] || 'python');
  });
  editor.setOption('mode', 'python');

  // ── Analyse ────────────────────────────────────────────────────────
  document.getElementById('analyse-btn').addEventListener('click', async function () {

    const code     = editor.getValue();
    const language = document.getElementById('language').value;

    if (!code.trim()) { showError('Please paste some code first.'); return; }

    resetResults();
    setLoading(this, true, 'Analysing...');

    try {
      const res = await fetch('/analyse', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code, language }),
      });

      if (!res.ok) throw new Error('Server error: ' + res.status);

      const data     = await res.json();
      storedAnalysis = data;
      storedCode     = code;

      displayAnalysis(data);

      const rb = document.getElementById('refactor-btn');
      rb.classList.remove('hidden');
      rb.disabled = false;

    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(document.getElementById('analyse-btn'), false, 'Analyse');
    }
  });

  // ── Refactor ───────────────────────────────────────────────────────
  document.getElementById('refactor-btn').addEventListener('click', async function () {

    if (!storedAnalysis || !storedCode) return;
    setLoading(this, true, 'Refactoring...');

    try {
      const res = await fetch('/refactor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: storedCode, analysis: storedAnalysis }),
      });

      if (!res.ok) throw new Error('Server error: ' + res.status);

      const data = await res.json();
      displayRefactored(data);

    } catch (err) {
      alert('Refactor error: ' + err.message);
      setLoading(document.getElementById('refactor-btn'), false, 'See Refactored Code');
    }
  });

});


// ── Display analysis ───────────────────────────────────────────────────
function displayAnalysis(data) {

  // Scores
  const ratingsCards = document.getElementById('ratings-cards');
  ratingsCards.innerHTML = '';

  if (data.Rates) {
    [
      ['Understandability', data.Rates.Understandability],
      ['Efficiency',        data.Rates.Efficiency],
      ['Maintainability',   data.Rates.Maintainability],
    ].forEach(function ([label, score]) {
      const level = score >= 7 ? 'score-high' : score >= 4 ? 'score-medium' : 'score-low';
      const card  = document.createElement('div');
      card.className = 'rating-card';
      card.innerHTML =
        '<span class="label">' + label + '</span>' +
        '<span class="score ' + level + '">' + score + '</span>' +
        '<span class="denom">/ 10</span>';
      ratingsCards.appendChild(card);
    });
  }

  // Functionality
  document.getElementById('functionality-text').textContent = data.Functionality || '';

  // Accordion — collapsed by default, no fixes yet
  const accordion = document.getElementById('accordion');
  accordion.innerHTML = '';

  const issues = data.Issues || [];
  document.getElementById('issue-count').textContent = issues.length;

  issues.forEach(function (issue, i) {
    accordion.appendChild(createAccordionItem(issue, i));
  });

  // Summary
  document.getElementById('summary-text').textContent = data.Summary || '';

  // Show results
  document.getElementById('results').classList.remove('hidden');
}


// ── Display refactored ─────────────────────────────────────────────────
function displayRefactored(data) {

  const language = document.getElementById('language').value;

  // 1 — Read-only editor
  editor.setOption('readOnly', 'nocursor');
  editor.getWrapperElement().classList.add('cm-readonly');

  // 2 — Refactored panel
  const refactoredPanel = document.getElementById('refactored-panel');
  const codeEl          = document.getElementById('refactored-code');

  const cleanCode = data.refactored_code
    ? data.refactored_code.replace(/\\n/g, '\n')
    : '';

  codeEl.className   = 'language-' + (PRISM_LANG[language] || 'python');
  codeEl.textContent = cleanCode;
  refactoredPanel.classList.remove('hidden');

  if (window.Prism) Prism.highlightElement(codeEl);

  // 3 — Inject fixes into accordion bodies
  const changes = data.changes || [];

  document.querySelectorAll('.accordion-item').forEach(function (item, i) {
    const body   = item.querySelector('.accordion-body');
    const issue  = storedAnalysis && storedAnalysis.Issues ? storedAnalysis.Issues[i] : null;
    const change = changes[i];

    body.innerHTML = '';
    body.appendChild(createIssueDetail(issue));

    if (change) {
      body.appendChild(createFixDetail(change));
    } else {
      const pending = document.createElement('p');
      pending.className = 'acc-fix-pending';
      pending.textContent = 'No specific fix recorded for this issue.';
      body.appendChild(pending);
    }
  });

  // 4 — Explanation
  if (data.explanation) {
    document.getElementById('explanation-text').textContent = stripMarkdown(data.explanation);
    document.getElementById('explanation-section').classList.remove('hidden');
  }

  // 5 — Disable refactor button
  const rb      = document.getElementById('refactor-btn');
  rb.disabled   = true;
  rb.textContent = 'Refactored';
}



// ── Strip basic markdown ───────────────────────────────────────────────
function createAccordionItem(issue, index) {
  const severity = normaliseSeverity(issue && issue.severity);
  const item = document.createElement('div');
  item.className = 'accordion-item severity-' + severity;
  item.dataset.index = index;

  const trigger = document.createElement('button');
  trigger.className = 'accordion-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');

  const number = document.createElement('span');
  number.className = 'acc-num';
  number.textContent = '#' + (index + 1);

  const badge = document.createElement('span');
  badge.className = 'severity-badge';
  badge.textContent = severity.toUpperCase();

  const summary = document.createElement('span');
  summary.className = 'acc-issue-text';
  summary.textContent = getIssueSummary(issue);

  const chevron = document.createElement('span');
  chevron.className = 'acc-chevron';
  chevron.textContent = 'v';
  chevron.setAttribute('aria-hidden', 'true');

  trigger.append(number, badge, summary, chevron);

  const body = document.createElement('div');
  body.className = 'accordion-body';
  body.appendChild(createIssueDetail(issue));

  const pending = document.createElement('p');
  pending.className = 'acc-fix-pending';
  pending.textContent = 'Run refactor to see where this is fixed.';
  body.appendChild(pending);

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = item.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  item.append(trigger, body);
  return item;
}

function createIssueDetail(issue) {
  const detail = document.createElement('div');
  detail.className = 'acc-detail';

  const label = document.createElement('span');
  label.className = 'acc-detail-label';
  label.textContent = 'Issue';

  const text = document.createElement('p');
  text.className = 'acc-detail-text';
  text.textContent = issue && issue.issue ? issue.issue : 'No issue detail provided.';

  detail.append(label, text);
  return detail;
}

function createFixDetail(change) {
  const fix = document.createElement('div');
  fix.className = 'acc-fix';

  const label = document.createElement('span');
  label.className = 'acc-detail-label';
  label.textContent = 'Fix';

  const line = document.createElement('span');
  line.className = 'acc-fix-line';
  line.textContent = 'Line ' + change.line;

  const description = document.createElement('span');
  description.className = 'acc-fix-desc';
  description.textContent = change.change || 'No fix description provided.';

  fix.append(label, line, description);
  return fix;
}

function getIssueSummary(issue) {
  if (!issue) return 'Issue summary unavailable.';

  const summary =
    issue.short_summary ||
    issue.shortSummary ||
    issue['Short summary'] ||
    issue['Short Summary'];

  if (summary) return summary;
  return firstSentence(issue.issue || 'Issue summary unavailable.');
}

function firstSentence(text) {
  const cleanText = String(text).replace(/\s+/g, ' ').trim();
  const match = cleanText.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : cleanText;
}

function normaliseSeverity(severity) {
  const value = String(severity || 'low').toLowerCase();
  return ['low', 'medium', 'high'].includes(value) ? value : 'low';
}

function stripMarkdown(text) {
  if (!text) return '';
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Numbered list items: "1. " at start
    .replace(/^\d+\.\s+/gm, '')
    // Strip any remaining backticks
    .replace(/`/g, '');
}

// ── Helpers ────────────────────────────────────────────────────────────
function resetResults() {
  document.getElementById('results').classList.add('hidden');
  document.getElementById('refactored-panel').classList.add('hidden');
  document.getElementById('explanation-section').classList.add('hidden');
  document.getElementById('accordion').innerHTML = '';

  if (editor) {
    editor.setOption('readOnly', false);
    editor.getWrapperElement().classList.remove('cm-readonly');
  }

  const rb = document.getElementById('refactor-btn');
  rb.classList.add('hidden');
  rb.disabled    = true;
  rb.textContent = 'See Refactored Code';

  storedAnalysis = null;
  storedCode     = null;
}

function setLoading(btn, loading, label) {
  btn.disabled    = loading;
  btn.textContent = label;
}

function showError(msg) {
  const results = document.getElementById('results');
  results.classList.remove('hidden');
  results.innerHTML =
    '<p style="color:var(--high);font-family:var(--mono);font-size:0.85rem;">' +
    msg + '</p>';
}
