// --- Homework 3: Stochastic Penetration Processes ---

function runSimulation() {
  const n = parseInt(document.getElementById('numSteps').value);
  const m = parseInt(document.getElementById('numAttackers').value);
  const model = document.getElementById('modelType').value;
  const scoreType = document.getElementById('scoreType').value;

  const trajectories = [];
  const finalValues = [];

  for (let j = 0; j < m; j++) {
    const path = [0]; // Step 0
    let currentSum = 0;

    for (let i = 1; i <= n; i++) {
      let x_i = 0;
      if (model === 'rademacher') {
        x_i = Math.random() < 0.5 ? -1 : 1;
      } else {
        x_i = Math.random() < 0.5 ? 0 : 1;
      }
      currentSum += x_i;

      let val = currentSum;
      if (scoreType === 'average') {
        val = currentSum / i;
      } else if (scoreType === 'normalized') {
        val = currentSum / Math.sqrt(i);
      }
      path.push(val);
    }

    trajectories.push(path);
    finalValues.push(path[n]);
  }

  drawTrajectories(trajectories, n, scoreType);
  drawHistogram(finalValues, scoreType, model);
  updateStatsTable(finalValues, n, model, scoreType);
}

function drawTrajectories(trajectories, n, scoreType) {
  const canvas = document.getElementById('trajectoryCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = 35;

  ctx.clearRect(0, 0, w, h);

  // Find min and max for scaling
  let minVal = Infinity, maxVal = -Infinity;
  trajectories.forEach(path => {
    path.forEach(v => {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    });
  });

  if (minVal === maxVal) { minVal -= 1; maxVal += 1; }
  const margin = (maxVal - minVal) * 0.1;
  minVal -= margin; maxVal += margin;

  // Draw Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 4; i++) {
    let y = pad + i * (h - 2 * pad) / 4;
    ctx.moveTo(pad, y); ctx.lineTo(w - pad, y);
    let val = maxVal - i * (maxVal - minVal) / 4;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText(val.toFixed(1), 5, y + 3);
  }
  ctx.stroke();

  // Draw Zero Line if visible
  if (minVal <= 0 && maxVal >= 0) {
    let zeroY = h - pad - ((0 - minVal) / (maxVal - minVal)) * (h - 2 * pad);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, zeroY); ctx.lineTo(w - pad, zeroY);
    ctx.stroke();
  }

  // Draw Trajectories
  ctx.lineWidth = 1;
  trajectories.forEach((path, idx) => {
    ctx.strokeStyle = `hsla(${(idx * 137.5) % 360}, 70%, 45%, 0.6)`;
    ctx.beginPath();
    for (let step = 0; step <= n; step++) {
      let x = pad + (step / n) * (w - 2 * pad);
      let y = h - pad - ((path[step] - minVal) / (maxVal - minVal)) * (h - 2 * pad);
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

function drawHistogram(values, scoreType, model) {
  const canvas = document.getElementById('histogramCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = 35;

  ctx.clearRect(0, 0, w, h);

  const numBins = 15;
  let minVal = Math.min(...values);
  let maxVal = Math.max(...values);
  if (minVal === maxVal) { minVal -= 1; maxVal += 1; }

  const binWidth = (maxVal - minVal) / numBins;
  const bins = new Array(numBins).fill(0);

  values.forEach(v => {
    let idx = Math.floor((v - minVal) / binWidth);
    if (idx >= numBins) idx = numBins - 1;
    bins[idx]++;
  });

  const maxCount = Math.max(...bins);

  // Draw Bins
  const chartW = w - 2 * pad;
  const chartH = h - 2 * pad;

  ctx.fillStyle = '#93c5fd';
  ctx.strokeStyle = '#2563eb';

  for (let i = 0; i < numBins; i++) {
    let bHeight = (bins[i] / maxCount) * chartH;
    let x = pad + i * (chartW / numBins);
    let y = h - pad - bHeight;
    ctx.fillRect(x, y, chartW / numBins - 1, bHeight);
    ctx.strokeRect(x, y, chartW / numBins - 1, bHeight);
  }

  // Draw Gaussian Curve Overlay for Normalized Rademacher
  if (scoreType === 'normalized' && model === 'rademacher') {
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let px = 0; px <= chartW; px += 2) {
      let val = minVal + (px / chartW) * (maxVal - minVal);
      let pdf = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * val * val);
      let targetHeight = pdf * (values.length * binWidth) * (chartH / (maxCount * binWidth || 1));
      let y = h - pad - Math.min(targetHeight, chartH);

      if (px === 0) ctx.moveTo(pad + px, y);
      else ctx.lineTo(pad + px, y);
    }
    ctx.stroke();
  }
}

function updateStatsTable(values, n, model, scoreType) {
  const tbody = document.querySelector('#statsTable tbody');
  if (!tbody) return;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

  let theoMean = 0, theoVar = 0;
  let p = model === 'rademacher' ? 0.5 : 0.5;
  let mu = model === 'rademacher' ? 0 : p;
  let sigma2 = model === 'rademacher' ? 1 : p * (1 - p);

  if (scoreType === 'total') {
    theoMean = n * mu;
    theoVar = n * sigma2;
  } else if (scoreType === 'average') {
    theoMean = mu;
    theoVar = sigma2 / n;
  } else if (scoreType === 'normalized') {
    theoMean = model === 'rademacher' ? 0 : (n * mu) / Math.sqrt(n);
    theoVar = sigma2;
  }

  tbody.innerHTML = `
    <tr>
      <td><strong>Mean (&mu;)</strong></td>
      <td>${theoMean.toFixed(4)}</td>
      <td><strong>${mean.toFixed(4)}</strong></td>
    </tr>
    <tr>
      <td><strong>Variance (&sigma;<sup>2</sup>)</strong></td>
      <td>${theoVar.toFixed(4)}</td>
      <td><strong>${variance.toFixed(4)}</strong></td>
    </tr>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('runSimBtn');
  if (btn) btn.addEventListener('click', runSimulation);
  runSimulation();
});