// projects.js — logic for the Projects page's category tabs.
// Exposed as PageInit.projects() so the shared router (jukebox.js) can
// (re)run it every time the Projects page content is swapped into view.

window.PageInit = window.PageInit || {};

PageInit.projects = function () {
  const catTabs = Array.from(document.querySelectorAll('.cat-tab'));
  const panels = Array.from(document.querySelectorAll('.cat-panel'));

  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catTabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('panel-' + tab.dataset.cat);
      if (panel) panel.classList.add('active');
      const catTabsEl = document.getElementById('catTabs');
      if (catTabsEl) {
        window.scrollTo({
          top: catTabsEl.offsetTop - 90,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      }
    });
  });
};
