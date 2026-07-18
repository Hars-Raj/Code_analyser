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

  // Accordion
  const accordion = document.getElementById('accordion');
  accordion.innerHTML = '';

  const issues = data.Issues || [];
  document.getElementById('issue-count').textContent = issues.length;

  issues.forEach(function (issue, i) {
    accordion.appendChild(createAccordionItem(issue, i));
  });

  // Summary
  document.getElementById('summary-text').textContent = data.Summary || '';

  document.getElementById('results').classList.remove('hidden');
}


// ── Display refactored ─────────────────────────────────────────────────
function displayRefactored(data) {

  const language = document.getElementById('language').value;

  editor.setOption('readOnly', 'nocursor');
  editor.getWrapperElement().classList.add('cm-readonly');

  const refactoredPanel = document.getElementById('refactored-panel');
  const codeEl          = document.getElementById('refactored-code');

  const cleanCode = data.refactored_code
    ? data.refactored_code.replace(/\\n/g, '\n')
    : '';

  codeEl.className   = 'language-' + (PRISM_LANG[language] || 'python');
  codeEl.textContent = cleanCode;
  refactoredPanel.classList.remove('hidden');

  if (window.Prism) Prism.highlightElement(codeEl);

  // Inject fixes into accordion bodies
  const changes = data.changes || [];

  document.querySelectorAll('.accordion-item').forEach(function (item, i) {
    const issue  = storedAnalysis && storedAnalysis.Issues ? storedAnalysis.Issues[i] : null;
    const change = changes[i];
    rebuildBodyWithFix(item, issue, change);
  });

  if (data.explanation) {
    document.getElementById('explanation-text').textContent = stripMarkdown(data.explanation);
    document.getElementById('explanation-section').classList.remove('hidden');
  }

  const rb      = document.getElementById('refactor-btn');
  rb.disabled   = true;
  rb.textContent = 'Refactored ✓';
}


// ── Create accordion item ──────────────────────────────────────────────
function createAccordionItem(issue, index) {
  const severity = normaliseSeverity(issue && issue.severity);

  const item = document.createElement('div');
  item.className = 'accordion-item severity-' + severity;
  item.dataset.index = index;

  // ── Trigger row
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

  const source = document.createElement('span');
  const srcVal = (issue && issue.source) ? issue.source : 'Gemini';
  source.className = 'acc-source source-' + srcVal.toLowerCase();
  source.textContent = srcVal;

  const summary = document.createElement('span');
  summary.className = 'acc-issue-text';
  summary.textContent = getIssueSummary(issue);

  const chevron = document.createElement('span');
  chevron.className = 'acc-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '▼';

  trigger.append(number, badge, source, summary, chevron);

  // ── Body — before refactor
  const body = document.createElement('div');
  body.className = 'accordion-body';
  buildBodyContent(body, issue, null);

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    const isOpen = item.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  item.append(trigger, body);
  return item;
}


// ── Build body content (shared before and after refactor) ──────────────
function buildBodyContent(body, issue, change) {
  body.innerHTML = '';

  // 1 — What's wrong
  body.appendChild(makeSection(
    "📝 Issue",
    issue && issue.issue ? issue.issue : 'No detail available.',
    null
  ));

  // 2 — Where in your code
  if (issue && issue.location && issue.location.start_line) {
    const loc = issue.location;
    const lineText = (loc.end_line && loc.end_line !== loc.start_line)
      ? 'Lines ' + loc.start_line + ' — ' + loc.end_line
      : 'Line ' + loc.start_line;
    body.appendChild(makeSection('📍 Location ', lineText, 'acc-location'));
  }

  // 3 — Source
  const sourceSection = document.createElement('div');
  sourceSection.className = 'acc-section';
  sourceSection.appendChild(makeSectionLabel('🔍 Analysis Engine'));

  const meta = document.createElement('div');
  meta.className = 'acc-meta';

  if (issue && issue.source) {
    const s = document.createElement('span');
    s.className = 'acc-meta-line';
    s.textContent = issue.source === 'Semgrep' ? 'Semgrep Static Analysis' : issue.source;
    meta.appendChild(s);
  }

  if (issue && issue.rule) {
    const ruleSection = document.createElement('div');
    ruleSection.className = 'acc-section';
    ruleSection.appendChild(makeSectionLabel('Rule'));
    const ruleVal = document.createElement('span');
    ruleVal.className = 'acc-meta-line acc-rule';
    ruleVal.textContent = issue.rule;
    ruleSection.appendChild(ruleVal);
    // will be appended after sourceSection
    meta._ruleSection = ruleSection;
  }

  // 4 — OWASP (only if non-empty)
  if (issue && issue.owasp && issue.owasp.length > 0) {
    const section = document.createElement('div');
    section.className = 'acc-section';

    const lbl = makeSectionLabel('OWASP category');
    section.appendChild(lbl);

    const pills = document.createElement('div');
    pills.className = 'owasp-pills';

    issue.owasp.forEach(function (entry) {
      // Build display string
      const display = (entry.id && entry.name && entry.id !== entry.name)
        ? entry.id + ' — ' + entry.name
        : (entry.name || entry.id || String(entry));

      const pill = document.createElement('span');
      pill.className = 'owasp-pill';

      if (entry.url) {
        const a = document.createElement('a');
        a.href = entry.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'owasp-link';
        a.textContent = display;
        pill.appendChild(a);
      } else {
        pill.textContent = display;
      }

      pills.appendChild(pill);
    });

    section.appendChild(pills);

    sourceSection.appendChild(meta);
    body.appendChild(sourceSection);

    if (meta._ruleSection) {
      body.appendChild(meta._ruleSection);
    }

    body.appendChild(section);
  }

  // 4 — Fix section
  const fixSection = document.createElement('div');
  fixSection.className = 'acc-fix-section';

  if (change) {
    // Populated after refactor
    fixSection.classList.add('acc-fix-populated');

    const fixLbl = makeSectionLabel('Suggested Fix');
    fixLbl.classList.add('acc-fix-label');
    fixSection.appendChild(fixLbl);

    const fixLine = document.createElement('span');
    fixLine.className = 'acc-fix-line';
    fixLine.textContent = 'Line ' + change.line;
    fixSection.appendChild(fixLine);

    const fixDesc = document.createElement('span');
    fixDesc.className = 'acc-fix-desc';
    fixDesc.textContent = change.change || 'No fix description provided.';
    fixSection.appendChild(fixDesc);

  } else {
    // Pending state
    fixSection.classList.add('acc-fix-pending-section');

    const fixLbl = makeSectionLabel('Suggested Fix');
    fixSection.appendChild(fixLbl);

    const pending = document.createElement('p');
    pending.className = 'acc-fix-pending';
    pending.textContent = 'Run Refactor to generate an improved version of this code.';
    fixSection.appendChild(pending);
  }

  body.appendChild(fixSection);
}


// ── Rebuild body after refactor ────────────────────────────────────────
function rebuildBodyWithFix(item, issue, change) {
  const body = item.querySelector('.accordion-body');
  buildBodyContent(body, issue, change);
}


// ── DOM helpers ────────────────────────────────────────────────────────
function makeSection(labelText, contentText, extraClass) {
  const section = document.createElement('div');
  section.className = 'acc-section';

  section.appendChild(makeSectionLabel(labelText));

  const p = document.createElement('p');
  p.className = 'acc-section-text' + (extraClass ? ' ' + extraClass : '');
  p.textContent = contentText;
  section.appendChild(p);

  return section;
}

function makeSectionLabel(text) {
  const span = document.createElement('span');
  span.className = 'acc-section-label';
  span.textContent = text;
  return span;
}

function getIssueSummary(issue) {
  if (!issue) return 'Issue summary unavailable.';
  return issue.short_summary || firstSentence(issue.issue || 'Issue summary unavailable.');
}

function firstSentence(text) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const match = clean.match(/^(.+?[.!?])(\s|$)/);
  return match ? match[1] : clean;
}

function normaliseSeverity(severity) {
  const v = String(severity || 'low').toLowerCase();
  return ['low', 'medium', 'high'].includes(v) ? v : 'low';
}

function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/`/g, '');
}

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