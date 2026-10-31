class ProgressChart {
  render() {
    const canvas = document.getElementById('progress-chart');
    const stats = document.getElementById('cookie-stats');

    if (!canvas || !stats) {
      return;
    }

    const state = JSON.parse(localStorage.getItem('earthguard-progress') || '{"savedCookies":1280,"history":[320,480,620,890,1180,1280]}');
    const values = state.history || [0, 0, 0, 0, 0, 0];
    const maxValue = Math.max(...values, 1);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;

    stats.textContent = `${state.savedCookies.toLocaleString()} cookies`;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#dfece2';
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
}

window.addEventListener('DOMContentLoaded', () => {
  const chart = new ProgressChart();
  chart.render();
});
