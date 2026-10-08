// --- Finite Field Arithmetic mod 17 ---
const P = 17;
const A = 0;
const B = 7;

function mod(n, m) {
  return ((n % m) + m) % m;
}

function modInverse(a, m) {
  a = mod(a, m);
  for (let x = 1; x < m; x++) {
    if (mod(a * x, m) === 1) return x;
  }
  return null;
}

function pointAdd(P1, P2) {
  if (!P1) return P2;
  if (!P2) return P1;

  let x1 = P1.x, y1 = P1.y;
  let x2 = P2.x, y2 = P2.y;

  if (x1 === x2 && mod(y1 + y2, P) === 0) return null; // Point at Infinity

  let m;
  if (x1 === x2 && y1 === y2) {
    let num = mod(3 * x1 * x1 + A, P);
    let den = modInverse(2 * y1, P);
    if (den === null) return null;
    m = mod(num * den, P);
  } else {
    let num = mod(y2 - y1, P);
    let den = modInverse(x2 - x1, P);
    if (den === null) return null;
    m = mod(num * den, P);
  }

  let x3 = mod(m * m - x1 - x2, P);
  let y3 = mod(m * (x1 - x3) - y1, P);

  return { x: x3, y: y3 };
}

function scalarMultiply(k, G) {
  let steps = [];
  let current = G;
  steps.push({ k: 1, point: G });

  for (let i = 2; i <= k; i++) {
    current = pointAdd(current, G);
    steps.push({ k: i, point: current });
  }
  return steps;
}

function getAllCurvePoints() {
  let points = [];
  for (let x = 0; x < P; x++) {
    let rhs = mod(x * x * x + B, P);
    for (let y = 0; y < P; y++) {
      if (mod(y * y, P) === rhs) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

function hammingDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  let val1 = (p1.x << 5) | p1.y;
  let val2 = (p2.x << 5) | p2.y;
  let xor = val1 ^ val2;
  let dist = 0;
  while (xor > 0) {
    dist += xor & 1;
    xor >>= 1;
  }
  return dist;
}

// --- UI Rendering & Chart Management ---
let freqChartInst = null;
let avalancheChartInst = null;
let scatterChartInst = null;

function runSimulation() {
  const kVal = parseInt(document.getElementById('privateKey').value);
  const gStr = document.getElementById('basePoint').value.split(',');
  const G = { x: parseInt(gStr[0]), y: parseInt(gStr[1]) };

  const steps = scalarMultiply(kVal, G);
  const finalPoint = steps[steps.length - 1].point;

  // Update Log Table
  const tbody = document.querySelector('#logTable tbody');
  tbody.innerHTML = '';
  steps.forEach(s => {
    let ptStr = s.point ? `(${s.point.x}, ${s.point.y})` : 'O (Infinity)';
    let opStr = s.k === 1 ? 'Base Point G' : `${s.k - 1}G + G`;
    tbody.innerHTML += `<tr><td>${s.k}</td><td>${opStr}</td><td><strong>${ptStr}</strong></td></tr>`;
  });

  // Update Public Key Display
  const pubKeyText = finalPoint ? `(${finalPoint.x}, ${finalPoint.y})` : 'O (Point at Infinity)';
  document.getElementById('pubKeyDisplay').innerHTML = `Toy Public Key Q = ${kVal}G: <strong>${pubKeyText}</strong>`;

  // Draw Grid Path
  drawCanvas(steps);

  // Render Statistical Charts
  renderStats(G);
}

function drawCanvas(steps) {
  const canvas = document.getElementById('eccCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const padding = 30;
  const stepSize = (w - 2 * padding) / 16;

  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i < 17; i++) {
    let pos = padding + i * stepSize;
    ctx.beginPath();
    ctx.moveTo(pos, padding);
    ctx.lineTo(pos, h - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, pos);
    ctx.lineTo(w - padding, pos);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.fillText(i, pos - 3, h - 10);
    ctx.fillText(16 - i, 10, pos + 3);
  }

  // Curve Points
  const allPoints = getAllCurvePoints();
  allPoints.forEach(pt => {
    let cx = padding + pt.x * stepSize;
    let cy = padding + (16 - pt.y) * stepSize;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#cbd5e1';
    ctx.fill();
  });

  // Path
  if (steps.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;

    steps.forEach((s, idx) => {
      if (!s.point) return;
      let cx = padding + s.point.x * stepSize;
      let cy = padding + (16 - s.point.y) * stepSize;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    steps.forEach((s, idx) => {
      if (!s.point) return;
      let cx = padding + s.point.x * stepSize;
      let cy = padding + (16 - s.point.y) * stepSize;
      ctx.beginPath();
      ctx.arc(cx, cy, idx === steps.length - 1 ? 7 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = idx === steps.length - 1 ? '#16a34a' : '#2563eb';
      ctx.fill();
    });
  }
}

function renderStats(G) {
  const fullSteps = scalarMultiply(18, G);
  
  let xCounts = Array(17).fill(0);
  fullSteps.forEach(s => {
    if (s.point) xCounts[s.point.x]++;
  });

  let hammingDists = [];
  let labelsH = [];
  for (let i = 1; i < fullSteps.length; i++) {
    let d = hammingDistance(fullSteps[i - 1].point, fullSteps[i].point);
    hammingDists.push(d);
    labelsH.push(`${i}G→${i+1}G`);
  }

  let kVals = fullSteps.map(s => s.k);
  let xVals = fullSteps.map(s => s.point ? s.point.x : 0);

  if (freqChartInst) freqChartInst.destroy();
  freqChartInst = new Chart(document.getElementById('freqChart'), {
    type: 'bar',
    data: {
      labels: Array.from({length: 17}, (_, i) => `x=${i}`),
      datasets: [{ label: 'Frequency of x-coordinate', data: xCounts, backgroundColor: '#3b82f6' }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  if (avalancheChartInst) avalancheChartInst.destroy();
  avalancheChartInst = new Chart(document.getElementById('avalancheChart'), {
    type: 'line',
    data: {
      labels: labelsH,
      datasets: [{ label: 'Hamming Distance', data: hammingDists, borderColor: '#ef4444', backgroundColor: '#fca5a5', fill: false }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  if (scatterChartInst) scatterChartInst.destroy();
  scatterChartInst = new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'k vs x(kG)',
        data: kVals.map((k, idx) => ({ x: k, y: xVals[idx] })),
        backgroundColor: '#8b5cf6'
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Private Key k' }, min: 1, max: 18 },
        y: { title: { display: true, text: 'Public Key x-coordinate' }, min: 0, max: 16 }
      }
    }
  });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('computeBtn').addEventListener('click', runSimulation);
  runSimulation();
});