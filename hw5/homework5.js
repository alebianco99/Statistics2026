// --- Homework 5: Integration (Riemann vs Lebesgue) & Normal CDF ---

// =======================================================
// EXERCISE 1: RIEMANN VS LEBESGUE INTEGRATION
// =======================================================

function getFunctionDetails(key) {
  switch (key) {
    case 'sin':
      return { f: x => Math.sin(x), a: 0, b: Math.PI, min: 0, max: 1, theo: 2.0 };
    case 'sq':
      return { f: x => x * x, a: 0, b: 1, min: 0, max: 1, theo: 1 / 3 };
    case 'step':
      return { f: x => x >= 0.5 ? 1 : 0, a: 0, b: 1, min: 0, max: 1, theo: 0.5 };
    case 'invsqrt':
      return { f: x => 1 / Math.sqrt(Math.max(x, 1e-7)), a: 0.001, b: 1, min: 1, max: 31.62, theo: 2.0 };
    case 'dirichlet':
      // Numerical simulation of Dirichlet: checks for floating-point rational approximations
      return { 
        f: x => (Number.isInteger(x * 1000) ? 1 : 0), 
        a: 0, b: 1, min: 0, max: 1, theo: 0.0, isPathological: true 
      };
    case 'thomae':
      return {
        f: x => {
          let q = 1000;
          for (let d = 1; d <= 50; d++) {
            if (Math.abs(x * d - Math.round(x * d)) < 1e-5) return 1 / d;
          }
          return 0;
        },
        a: 0, b: 1, min: 0, max: 1, theo: 0.0, isPathological: true
      };
    default:
      return { f: x => x, a: 0, b: 1, min: 0, max: 1, theo: 0.5 };
  }
}

function computeRiemann(f, a, b, N) {
  const dx = (b - a) / N;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    let x = a + (i + 0.5) * dx; // Midpoint Riemann sum
    sum += f(x) * dx;
  }
  return sum;
}

function computeLebesgue(f, a, b, yMin, yMax, M) {
  const dy = (yMax - yMin) / M;
  const gridN = 2000; // Dense domain grid for preimage measurement
  const dx = (b - a) / gridN;
  let totalIntegral = 0;

  for (let j = 0; j < M; j++) {
    let yLow = yMin + j * dy;
    let yHigh = yLow + dy;

    // Measure preimage size E_j = {x in [a,b] | yLow <= f(x) < yHigh}
    let measure = 0;
    for (let k = 0; k < gridN; k++) {
      let x = a + k * dx;
      let val = f(x);
      if (val >= yLow && val < yHigh) {
        measure += dx;
      }
    }
    totalIntegral += yLow * measure;
  }
  return totalIntegral;
}

function runIntegrationDemo() {
  const key = document.getElementById('functionSelect').value;
  const N = parseInt(document.getElementById('riemannSubdiv').value);
  const M = parseInt(document.getElementById('lebesgueSubdiv').value);

  const details = getFunctionDetails(key);
  const riemannVal = computeRiemann(details.f, details.a, details.b, N);
  const lebesgueVal = computeLebesgue(details.f, details.a, details.b, details.min, details.max, M);

  const tbody = document.querySelector('#integrationTable tbody');
  if (!tbody) return;

  const rErr = Math.abs(riemannVal - details.theo);
  const lErr = Math.abs(lebesgueVal - details.theo);

  tbody.innerHTML = `
    <tr>
      <td><strong>Riemann Integral</strong></td>
      <td>Domain [a, b] Partition (&Delta;x)</td>
      <td><strong>${riemannVal.toFixed(6)}</strong></td>
      <td>${details.theo.toFixed(6)}</td>
      <td>${details.isPathological ? 'Undefined / Non-convergent' : rErr.toExponential(4)}</td>
    </tr>
    <tr>
      <td><strong>Lebesgue Integral</strong></td>
      <td>Range [y<sub>min</sub>, y<sub>max</sub>] Preimage (&Delta;y)</td>
      <td><strong>${lebesgueVal.toFixed(6)}</strong></td>
      <td>${details.theo.toFixed(6)}</td>
      <td>${lErr.toExponential(4)}</td>
    </tr>
  `;
}

// =======================================================
// EXERCISE 2: NORMAL CDF COMPUTATION & ERF
// =======================================================

// Reference Standard Normal CDF using Abramowitz & Stegun (7 decimal accuracy)
function referenceNormalCDF(z) {
  if (z < -8.0) return 0.0;
  if (z > 8.0) return 1.0;

  let total = 0;
  let flag = false;
  if (z < 0) {
    flag = true;
    z = -z;
  }

  let b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937, b4 = -1.821255978, b5 = 1.330274429;
  let p = 0.2316419;
  let t = 1.0 / (1.0 + p * z);
  let pdf = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);

  let cdf = 1.0 - pdf * (b1 * t + b2 * t * t + b3 * Math.pow(t, 3) + b4 * Math.pow(t, 4) + b5 * Math.pow(t, 5));

  return flag ? 1.0 - cdf : cdf;
}

// Method 1: Simpson's Rule Quadrature
function cdfSimpson(z, N) {
  if (z < -8) return 0;
  const a = -10.0;
  const b = z;
  if (b <= a) return 0;

  const h = (b - a) / N;
  const pdf = x => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

  let sum = pdf(a) + pdf(b);
  for (let i = 1; i < N; i += 2) sum += 4 * pdf(a + i * h);
  for (let i = 2; i < N - 1; i += 2) sum += 2 * pdf(a + i * h);

  return Math.min(Math.max((h / 3) * sum, 0), 1);
}

// Method 2: Error Function (erf) Series Expansion
function erfSeries(x) {
  const terms = 30;
  let sum = 0;
  for (let n = 0; n < terms; n++) {
    let num = Math.pow(-1, n) * Math.pow(x, 2 * n + 1);
    let den = factorial(n) * (2 * n + 1);
    sum += num / den;
  }
  return (2 / Math.sqrt(Math.PI)) * sum;
}

function factorial(n) {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function cdfErfSeries(z) {
  let x = z / Math.sqrt(2);
  return 0.5 * (1 + erfSeries(x));
}

function runCdfDemo() {
  const z = parseFloat(document.getElementById('evalZ').value);
  const N = parseInt(document.getElementById('quadSteps').value);

  const refVal = referenceNormalCDF(z);
  const simpsonVal = cdfSimpson(z, N);
  const erfSeriesVal = cdfErfSeries(z);

  const tbody = document.querySelector('#cdfTable tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td><strong>Numerical Quadrature</strong></td>
      <td>Simpson's Rule over [-10, z]</td>
      <td><strong>${simpsonVal.toFixed(8)}</strong></td>
      <td>${Math.abs(simpsonVal - refVal).toExponential(4)}</td>
    </tr>
    <tr>
      <td><strong>erf(z) Power Series</strong></td>
      <td>Taylor Expansion (30 terms)</td>
      <td><strong>${erfSeriesVal.toFixed(8)}</strong></td>
      <td>${Math.abs(erfSeriesVal - refVal).toExponential(4)}</td>
    </tr>
    <tr>
      <td><strong>Polynomial Approximation</strong></td>
      <td>Abramowitz &amp; Stegun (Reference)</td>
      <td><strong>${refVal.toFixed(8)}</strong></td>
      <td>0.0000e+0 (Benchmark)</td>
    </tr>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const btn1 = document.getElementById('runIntegrationBtn');
  const btn2 = document.getElementById('runCdfBtn');

  if (btn1) btn1.addEventListener('click', runIntegrationDemo);
  if (btn2) btn2.addEventListener('click', runCdfDemo);

  runIntegrationDemo();
  runCdfDemo();
});