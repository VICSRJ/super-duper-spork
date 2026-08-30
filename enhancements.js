(() => {
  'use strict';

  const THEME_KEY = 'botanic-wms-theme';
  const root = document.documentElement;

  const savedTheme = localStorage.getItem(THEME_KEY);
  root.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';

  function refreshThemeButton() {
    const button = document.getElementById('themeToggle');
    if (!button) return;
    const light = root.dataset.theme === 'light';
    button.textContent = light ? '☾' : '☀';
    button.title = light ? 'Přepnout na tmavý režim' : 'Přepnout na světlý režim';
    button.setAttribute('aria-label', button.title);
  }

  function addThemeControl() {
    const actions = document.querySelector('.top-actions');
    if (!actions || document.getElementById('themeToggle')) return;
    const button = document.createElement('button');
    button.className = 'wms-theme-toggle';
    button.id = 'themeToggle';
    button.type = 'button';
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, root.dataset.theme);
      refreshThemeButton();
    });
    actions.insertBefore(button, actions.firstChild);
    refreshThemeButton();
  }

  function addConnectionState() {
    const actions = document.querySelector('.top-actions');
    if (!actions || document.getElementById('connectionState')) return;
    const status = document.createElement('span');
    status.className = 'wms-status';
    status.id = 'connectionState';
    status.innerHTML = '<i class="wms-status-dot"></i><span>Lokální data</span>';
    actions.insertBefore(status, actions.firstChild);

    const update = () => {
      const dot = status.querySelector('.wms-status-dot');
      const text = status.querySelector('span:last-child');
      const online = navigator.onLine;
      dot.classList.toggle('offline', !online);
      text.textContent = online ? 'Online · lokální data' : 'Offline · lokální data';
    };
    update();
    addEventListener('online', update);
    addEventListener('offline', update);
  }

  function injectAttentionStrip() {
    const dashboard = document.getElementById('view-dashboard');
    if (!dashboard || !dashboard.classList.contains('active')) return;
    if (dashboard.querySelector('.wms-attention')) return;
    const source = [...dashboard.querySelectorAll('.badge')].filter(el => /NÍZKÁ|EXPIRACE|BRZY/.test(el.textContent));
    if (!source.length) return;

    const strip = document.createElement('div');
    strip.className = 'wms-attention';
    strip.innerHTML = `<div class="wms-attention-icon">!</div><div><strong>${source.length} polož${source.length === 1 ? 'ka' : 'ky'} vyžadují pozornost</strong><span> Zkontrolujte nízkou zásobu nebo blížící se expiraci.</span></div><button class="ghost-btn" type="button">Zobrazit zásoby</button>`;
    strip.querySelector('button').addEventListener('click', () => window.setView?.('inventory'));
    const head = dashboard.querySelector('.page-head');
    head?.after(strip);
  }

  function enhanceDialogDefaults() {
    const dialog = document.getElementById('actionDialog');
    if (!dialog) return;
    const expiry = dialog.querySelector('input[name="expiry"]');
    const received = dialog.querySelector('input[name="received"]');
    if (expiry && received && !expiry.value) {
      const base = new Date(`${received.value}T12:00:00`);
      base.setFullYear(base.getFullYear() + 1);
      expiry.value = base.toISOString().slice(0, 10);
    }
  }

  document.addEventListener('keydown', event => {
    const meta = event.ctrlKey || event.metaKey;
    if (meta && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
    if (meta && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      window.openReceive?.();
    }
    if (event.key === 'Escape') {
      const dialog = document.getElementById('actionDialog');
      if (dialog?.open) dialog.close();
    }
  });

  const observer = new MutationObserver(() => {
    addThemeControl();
    addConnectionState();
    injectAttentionStrip();
    enhanceDialogDefaults();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  addThemeControl();
  addConnectionState();
  setTimeout(injectAttentionStrip, 0);
  setTimeout(enhanceDialogDefaults, 0);
})();
