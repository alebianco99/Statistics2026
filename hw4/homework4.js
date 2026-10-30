// --- Homework 4: Welford's Algorithm & Sampling Statistics ---

// Theoretical parameters for Uniform U(0, 10)
const THEO_MEAN = 5.0;
const THEO_VAR = 100.0 / 12.0; // ~8.3333

// Core Welford Class
class WelfordAccumulator {
  constructor() {
    this.count = 0;
    this.mean = 0;
    this.M2 = 0;
  }

  // Core 3-line update logic
  update(x) {
    this.count++;
    const delta = x - this.mean;
    this.mean += delta / this.count;
    this.M2 += delta * (x - this.mean);
  }

  getSampleVariance() {
    return this.count > 1 ? this.M2 / (this.count - 1) : 0;
  }
}

function runWelfordSimulation() {
  const n = parseInt(document.getElementById('numSystems').value);
  const m = parseInt(document.getElementById('numHackers').value);

  const hackerMeans = [];
  const hackerVars = [];
  const meanTrajectories = [];

  for (let j = 0; j < m; j++) {
    const acc = new WelfordAccumulator();
    const path = [];

    for (let i = 1; i <= n; i++) {
      const score = Math.random() * 10; // Uniform U(0, 10)
      acc.update(score);
      path.push(acc.mean);
    }

    hackerMeans.push(acc.mean);
    hackerVars.push(acc.getSampleVariance());
    meanTrajectories.push(path);
  }

  drawWelfordTrajectories(meanTrajectories, n);
  drawWelfordHistogram(hackerMeans);
  updateWelfordTable(hackerMeans, hackerVars);
}

function drawWelfordTrajectories(trajectories, n) {
  const canvas = document.getElementById('welfordTrajectoryCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const pad = 35;

  ctx.clearRect(0, 0, w, h);

  // Y-axis range fixed around 0 to 10
  const minVal = 0, maxVal = 10;

  // Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    let y = pad + i * (h - 2 * pad) / 5;
    ctx.moveTo(pad, y); ctx.lineTo(w - pad, y);
    let val = maxVal - i * (maxVal - minVal) / 5;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText(val.toFixed(1), 5, y + 3);
  }
  ctx.stroke();

  // Theoretical Mean Line (y = 5)
  let theoY = h - pad - ((THEO_MEAN - minVal) / (maxVal - minVal)) * (h - 2 * pad);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, theoY); ctx.lineTo(w - pad, theoY);
  ctx.stroke();

  // Draw Trajectories
  trajectories.forEach((path, idx) => {
    ctx.strokeStyle = `hsla(${(idx * 137.5) % 360}, 70%, 45%, 0.4)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let step = 0; step < n; step++) {
      let x = pad + (step / (n - 1)) * (w - 2 * pad);
      let y = h - pad - ((path[step] - minVal) / (maxVal - minVal)) * (h - 2 * pad);
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

function drawWelfordHistogram(means) {
  const canvas = document.getElementById('welfordHistCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const pad = 35;

  ctx.clearRect(0, 0, w, h);

  const numBins = 15;
  let minVal = Math.min(...means);
  let maxVal = Math.max(...means);
  if (minVal === maxVal) { minVal -= 0.5; maxVal += 0.5; }

  const binWidth = (maxVal - minVal) / numBins;
  const bins = new Array(numBins).fill(0);

  means.forEach(v => {
    let idx = Math.floor((v - minVal) / binWidth);
    if (idx >= numBins) idx = numBins - 1;
    bins[idx]++;
  });

  const maxCount = Math.max(...bins);
  const chartW = w - 2 * pad;
  const chartH = h - 2 * pad;

  ctx.fillStyle = '#86efac';
  ctx.strokeStyle = '#16a34a';

  for (let i = 0; i < numBins; i++) {
    let bHeight = (bins[i] / (maxCount || 1)) * chartH;
    let x = pad + i * (chartW / numBins);
    let y = h - pad - bHeight;
    ctx.fillRect(x, y, chartW / numBins - 1, bHeight);
    ctx.strokeRect(x, y, chartW / numBins - 1, bHeight);
  }
}

function updateWelfordTable(means, vars) {
  const tbody = document.querySelector('#welfordTable tbody');
  if (!tbody) return;

  const avgMean = means.reduce((a, b) => a + b, 0) / means.length;
  const avgVar = vars.reduce((a, b) => a + b, 0) / vars.length;

  const meanBias = avgMean - THEO_MEAN;
  const varBias = avgVar - THEO_VAR;

  tbody.innerHTML = `
    <tr>
      <td><strong>Mean (&mu;)</strong></td>
      <td>${THEO_MEAN.toFixed(4)}</td>
      <td><strong>${avgMean.toFixed(4)}</strong></td>
      <td>${meanBias >= 0 ? '+' : ''}${meanBias.toFixed(4)}</td>
    </tr>
    <tr>
      <td><strong>Variance (&sigma;<sup>2</sup>)</strong></td>
      <td>${THEO_VAR.toFixed(4)}</td>
      <td><strong>${avgVar.toFixed(4)}</strong></td>
      <td>${varBias >= 0 ? '+' : ''}${varBias.toFixed(4)}</td>
    </tr>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('runWelfordSimBtn');
  if (btn) btn.addEventListener('click', runWelfordSimulation);
  runWelfordSimulation();
});