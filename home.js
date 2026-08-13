// home.js — logic for the Home ("about.py" etc.) page.
// Exposed as PageInit.home() so the shared router (jukebox.js) can
// (re)run it every time the Home page content is swapped into view.

window.PageInit = window.PageInit || {};

PageInit.home = function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Hero terminal boot sequence ----------
  const termBody = document.getElementById('termBody');
  const bootLines = [
    { type: 'cmd', text: 'whoami' },
    { type: 'out', text: 'nathan_delaportas - quant-minded software engineer' },
    { type: 'cmd', text: 'cat mission.txt' },
    { type: 'out', text: "MEng Computer Science (Surrey) -> MSc Computational Finance (KCL)" },
    { type: 'out', text: 'Deeply interested in software engineering, and drawn to the development and research of quantitative finance.' },
    { type: 'cmd', text: './load_portfolio.sh' },
    { type: 'out', text: '[OK] about · education · experience · projects · skills · contact' },
  ];

  function renderStatic() {
    if (!termBody) return;
    termBody.innerHTML = bootLines.map(l => {
      if (l.type === 'cmd') {
        return `<p class="term-line"><span class="prompt">nathan@nd</span> <span class="path">~</span> $ ${l.text}</p>`;
      }
      return `<p class="term-out">${l.text}</p>`;
    }).join('') + '<p class="term-line"><span class="prompt">nathan@nd</span> <span class="path">~</span> $ <span class="caret"></span></p>';
  }

  function typeBoot() {
    if (!termBody) return;
    termBody.innerHTML = '';
    let i = 0;
    function next() {
      if (i >= bootLines.length) {
        const p = document.createElement('p');
        p.className = 'term-line';
        p.innerHTML = '<span class="prompt">nathan@nd</span> <span class="path">~</span> $ <span class="caret"></span>';
        termBody.appendChild(p);
        return;
      }
      const line = bootLines[i];
      const p = document.createElement('p');
      p.className = line.type === 'cmd' ? 'term-line' : 'term-out';
      termBody.appendChild(p);

      if (line.type === 'cmd') {
        const prefix = '<span class="prompt">nathan@nd</span> <span class="path">~</span> $ ';
        let charIndex = 0;
        const text = line.text;
        function typeChar() {
          p.innerHTML = prefix + text.slice(0, charIndex) + '<span class="caret"></span>';
          charIndex++;
          if (charIndex <= text.length) {
            setTimeout(typeChar, 18);
          } else {
            i++;
            setTimeout(next, 160);
          }
        }
        typeChar();
      } else {
        p.textContent = line.text;
        i++;
        setTimeout(next, 90);
      }
    }
    next();
  }

  if (termBody) {
    if (reduceMotion) { renderStatic(); } else { typeBoot(); }
  }

  // ---------- Git log (experience) ----------
  const commits = [
    { hash: 'e91a4c7', org: 'Synk', role: 'Software Engineering Intern', date: 'Jun 2026 – Aug 2026', desc: '' },
    { hash: 'b40f218', org: 'Tutor Hunt', role: 'Mathematics Tutor', date: 'Apr 2025 – Present', desc: 'Delivered one-to-one A-Level tuition in Mathematics, Further Mathematics and Computer Science to over 120 students, adapting explanations to individual learning needs.' },
    { hash: 'c7d3a92', org: 'University of Surrey', role: 'PALS Peer Support Leader — Advanced Algorithms', date: 'Sep 2025 – Dec 2025', desc: 'Facilitated weekly Advanced Algorithms laboratory sessions, explaining algorithm design and complexity analysis while supporting structured technical problem-solving.' },
    { hash: '5f18b6a', org: 'NHR Automotive Ltd', role: 'Data Analyst Intern', date: 'Jun 2025 – Aug 2025', desc: 'Analysed vehicle sales, pricing trends and inventory turnover, developing KPI dashboards covering lead conversion, stock ageing and profit per vehicle.' },
    { hash: '9c4f0e3', org: 'Unlock Your Potential', role: 'Technology & Data Volunteer', date: 'Aug 2024', desc: "Developed digital tools and data-driven solutions to support the non-profit's online engagement initiatives, collaborating with stakeholders on scalable solutions." },
  ];

  const gitlog = document.getElementById('gitlog');
  if (gitlog) {
    gitlog.innerHTML = commits.map((c) => `
      <div class="commit">
        <div class="commit-rail">
          <div class="commit-dot"></div>
          <div class="commit-line"></div>
        </div>
        <div class="commit-body">
          <div class="commit-hash">${c.hash}</div>
          <div class="commit-date">Date: ${c.date}</div>
          <div class="commit-title">${c.role} <span class="org">@ ${c.org}</span></div>
          ${c.desc ? `<p class="commit-desc">${c.desc}</p>` : ''}
        </div>
      </div>
    `).join('');
  }

  // ---------- Tab navigation + active state ----------
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const sections = tabs.map(t => document.getElementById(t.dataset.target));

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = document.getElementById(tab.dataset.target);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  if (window._homeIO) { window._homeIO.disconnect(); }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const idx = sections.indexOf(entry.target);
      if (idx === -1) return;
      if (entry.isIntersecting) {
        tabs.forEach(t => t.classList.remove('active'));
        tabs[idx].classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
  window._homeIO = io;
  sections.forEach(s => { if (s) io.observe(s); });

  // ---------- Fade-in on scroll ----------
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('shown');
        fadeIo.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  fadeEls.forEach(el => fadeIo.observe(el));
};
