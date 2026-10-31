const STORAGE_KEY = 'earthguard-progress';

const defaultProgress = {
  savedCookies: 1280,
  history: [320, 480, 620, 890, 1180, 1280],
};

function getProgressState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProgress));
    return defaultProgress;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProgress));
    return defaultProgress;
  }
}

function saveProgressState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateStats() {
  const state = getProgressState();
  const cookieStats = document.getElementById('cookie-stats');
  if (cookieStats) {
    cookieStats.textContent = `${state.savedCookies.toLocaleString()} cookies`;
  }
}

function bumpProgress() {
  const state = getProgressState();
  const nextValue = state.savedCookies + 75;
  state.savedCookies = nextValue;
  state.history = [...state.history.slice(-5), nextValue];
  saveProgressState(state);
  updateStats();
  drawChart();
}

function resetProgress() {
  const resetState = {
    savedCookies: 0,
    history: [0, 0, 0, 0, 0, 0],
  };
  saveProgressState(resetState);
  updateStats();
  drawChart();
}

function drawChart() {
  const canvas = document.getElementById('progress-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const state = getProgressState();
  const values = state.history.length ? state.history : [0, 0, 0, 0, 0, 0];

  const width = canvas.width;
  const height = canvas.height;
  const padding = 30;
  const maxValue = Math.max(...values, 1);

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border');
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (values.length - 1);
    const y = height - padding - (value / maxValue) * (height - padding * 2);
    return { x, y };
  });

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.strokeStyle = '#2d7d46';
  ctx.lineWidth = 3;
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.fillStyle = '#5cb784';
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function setupTipsModal() {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const text = document.getElementById('modal-text');
  const closeBtn = document.querySelector('.modal-close');
  const actionBtn = document.getElementById('modal-action');

  if (!modal || !title || !text || !closeBtn || !actionBtn) return;

  document.querySelectorAll('.tip-card').forEach((tip) => {
    tip.addEventListener('click', () => {
      const content = tip.dataset.tipContent || 'Sustainability tip';
      title.textContent = 'Daily Sustainability Tip';
      text.textContent = content;
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  });

  actionBtn.addEventListener('click', () => {
    bumpProgress();
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  });
}

function setupThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const themeKey = 'earthguard-theme';
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    toggle.textContent = '☀️';
  }

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    toggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem(themeKey, isDark ? 'dark' : 'light');
  });
}

function setupNavigation() {
  const scrollButton = document.getElementById('scroll-btn');
  if (scrollButton) {
    scrollButton.addEventListener('click', () => {
      document.getElementById('action')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const mobileMenuButton = document.getElementById('mobile-menu-btn');
  const nav = document.querySelector('nav');
  if (mobileMenuButton && nav) {
    mobileMenuButton.addEventListener('click', () => {
      const isVisible = nav.style.display === 'flex';
      nav.style.display = isVisible ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.position = 'absolute';
      nav.style.top = '72px';
      nav.style.right = '1rem';
      nav.style.background = getComputedStyle(document.body).backgroundColor;
      nav.style.padding = '1rem';
      nav.style.border = '1px solid var(--border)';
      nav.style.borderRadius = '12px';
      nav.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
    });
  }
}

function setupProgress() {
  const resetButton = document.getElementById('track-reset');
  if (resetButton) {
    resetButton.addEventListener('click', resetProgress);
  }

  updateStats();
  drawChart();
}

window.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupTipsModal();
  setupNavigation();
  setupProgress();
});
