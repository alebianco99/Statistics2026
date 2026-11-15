// --- Homework 6: Statistical Independence and Contingency Tables ---

const PRESETS = {
  dependent: [
    "Phishing, Compromised", "Phishing, Compromised", "Phishing, Compromised", "Phishing, Compromised",
    "Phishing, Compromised", "Phishing, Compromised", "Phishing, Compromised", "Phishing, Blocked",
    "Phishing, Blocked", "Phishing, Blocked", "DDoS, Blocked", "DDoS, Blocked", "DDoS, Blocked",
    "DDoS, Blocked", "DDoS, Blocked", "DDoS, Blocked", "DDoS, Blocked", "DDoS, Compromised",
    "DDoS, Compromised", "ZeroDay, Compromised", "ZeroDay, Compromised", "ZeroDay, Compromised",
    "ZeroDay, Compromised", "ZeroDay, Compromised", "ZeroDay, Blocked"
  ].join("\n"),

  independent: [
    "Linux, Healthy", "Linux, Healthy", "Linux, Healthy", "Linux, Healthy",
    "Linux, Healthy", "Linux, Healthy", "Linux, Healthy", "Linux, Healthy",
    "Linux, HardwareFail", "Linux, HardwareFail", "Windows, Healthy", "Windows, Healthy",
    "Windows, Healthy", "Windows, Healthy", "Windows, Healthy", "Windows, Healthy",
    "Windows, Healthy", "Windows, Healthy", "Windows, HardwareFail", "Windows, HardwareFail",
    "BSD, Healthy", "BSD, Healthy", "BSD, Healthy", "BSD, Healthy", "BSD, HardwareFail"
  ].join("\n"),

  spurious: [
    "HighSales, Outage", "HighSales, Outage", "HighSales, Outage", "HighSales, Outage",
    "HighSales, Outage", "HighSales, Outage", "HighSales, Normal", "HighSales, Normal",
    "LowSales, Normal", "LowSales, Normal", "LowSales, Normal", "LowSales, Normal",
    "LowSales, Normal", "LowSales, Normal", "LowSales, Normal", "LowSales, Outage"
  ].join("\n")
};

// Numerical computation of Upper Incomplete Gamma Function Q(a, x) for Chi-Square p-value
function logGamma(z) {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  let x = z;
  let y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += c[j] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function chiSquarePValue(chi2, df) {
  if (chi2 <= 0 || df <= 0) return 1.0;
  const a = df / 2.0;
  const x = chi2 / 2.0;

  if (x < a + 1.0) {
    // Series representation for lower incomplete gamma P(a, x)
    let ap = a;
    let del = 1.0 / a;
    let sum = del;
    for (let n = 1; n <= 200; n++) {
      ap += 1.0;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
    }
    const p = sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
    return Math.max(0, 1.0 - p);
  } else {
    // Continued fraction representation for upper incomplete gamma Q(a, x)
    let b = x + 1.0 - a;
    let c = 1.0 / 1e-30;
    let d = 1.0 / b;
    let h = d;
    for (let i = 1; i <= 200; i++) {
      let an = -i * (i - a);
      b += 2.0;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1.0 / d;
      let del = d * c;
      h *= del;
      if (Math.abs(del - 1.0) < 1e-12) break;
    }
    return Math.min(1, Math.max(0, Math.exp(-x + a * Math.log(x) - logGamma(a)) * h));
  }
}

function parseDataset(rawText) {
  const lines = rawText.split("\n");
  const pairs = [];
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(",");
    if (parts.length >= 2) {
      const xVal = parts[0].trim();
      const fVal = parts[1].trim();
      if (xVal && fVal) {
        pairs.push({ x: xVal, f: fVal });
      }
    }
  }
  return pairs;
}

function analyzeBivariateData() {
  const rawText = document.getElementById("bivariateInput").value;
  const pairs = parseDataset(rawText);

  if (pairs.length === 0) return;

  const xCategories = [...new Set(pairs.map(p => p.x))];
  const fCategories = [...new Set(pairs.map(p => p.f))];
  const N = pairs.length;

  // Initialize observed counts matrix O[i][j]
  const O = Array.from({ length: xCategories.length }, () =>
    Array(fCategories.length).fill(0)
  );

  pairs.forEach(p => {
    const i = xCategories.indexOf(p.x);
    const j = fCategories.indexOf(p.f);
    O[i][j]++;
  });

  // Compute marginal totals
  const rowTotals = O.map(row => row.reduce((a, b) => a + b, 0));
  const colTotals = fCategories.map((_, j) =>
    O.reduce((sum, row) => sum + row[j], 0)
  );

  // Compute Expected counts E[i][j] and Chi-Square statistic
  const E = Array.from({ length: xCategories.length }, () =>
    Array(fCategories.length).fill(0)
  );
  let chi2 = 0;

  for (let i = 0; i < xCategories.length; i++) {
    for (let j = 0; j < fCategories.length; j++) {
      E[i][j] = (rowTotals[i] * colTotals[j]) / N;
      if (E[i][j] > 0) {
        chi2 += Math.pow(O[i][j] - E[i][j], 2) / E[i][j];
      }
    }
  }

  const df = (xCategories.length - 1) * (fCategories.length - 1);
  const pValue = df > 0 ? chiSquarePValue(chi2, df) : 1.0;

  // Update summary box
  document.getElementById("statN").innerText = N;
  document.getElementById("statDf").innerText = df;
  document.getElementById("statChi2").innerText = chi2.toFixed(4);
  document.getElementById("statPVal").innerText = pValue < 0.0001 ? pValue.toExponential(3) : pValue.toFixed(4);

  const conclusionEl = document.getElementById("statConclusion");
  const resultBox = document.getElementById("testResultBox");

  if (df === 0) {
    conclusionEl.innerText = "Insufficient categories (need at least 2 distinct values for both X and F).";
    conclusionEl.style.color = "#64748b";
  } else if (pValue < 0.05) {
    conclusionEl.innerText = "Reject H0 - Variables X and F are STATISTICALLY DEPENDENT (Significant Association).";
    conclusionEl.style.color = "#dc2626";
    resultBox.style.background = "#fef2f2";
    resultBox.style.borderColor = "#fca5a5";
  } else {
    conclusionEl.innerText = "Fail to Reject H0 - Variables X and F appear STATISTICALLY INDEPENDENT.";
    conclusionEl.style.color = "#16a34a";
    resultBox.style.background = "#f0fdf4";
    resultBox.style.borderColor = "#86efac";
  }

  renderObservedTable(xCategories, fCategories, O, rowTotals, colTotals, N);
  renderConditionalTable(xCategories, fCategories, O, rowTotals, colTotals, N);
  renderExpectedTable(xCategories, fCategories, E, rowTotals, colTotals, N);
}

function renderObservedTable(xCats, fCats, O, rowTotals, colTotals, N) {
  let html = `<table class="log-table"><thead><tr><th>X \\ F</th>`;
  fCats.forEach(f => { html += `<th>${f}</th>`; });
  html += `<th>Marginal Row Count (R<sub>i</sub>)</th><th>Marginal P(X)</th></tr></thead><tbody>`;

  for (let i = 0; i < xCats.length; i++) {
    html += `<tr><td><strong>${xCats[i]}</strong></td>`;
    for (let j = 0; j < fCats.length; j++) {
      html += `<td>${O[i][j]} <span style="color:#64748b; font-size:0.85em;">(${(O[i][j] / N).toFixed(3)})</span></td>`;
    }
    html += `<td><strong>${rowTotals[i]}</strong></td><td><strong>${(rowTotals[i] / N).toFixed(3)}</strong></td></tr>`;
  }

  html += `<tr style="background:#f1f5f9;"><td><strong>Marginal Col Count (C<sub>j</sub>)</strong></td>`;
  for (let j = 0; j < fCats.length; j++) {
    html += `<td><strong>${colTotals[j]}</strong></td>`;
  }
  html += `<td><strong>${N}</strong></td><td><strong>1.000</strong></td></tr>`;

  html += `<tr style="background:#f1f5f9;"><td><strong>Marginal P(F)</strong></td>`;
  for (let j = 0; j < fCats.length; j++) {
    html += `<td><strong>${(colTotals[j] / N).toFixed(3)}</strong></td>`;
  }
  html += `<td>-</td><td>-</td></tr></tbody></table>`;

  document.getElementById("observedTableContainer").innerHTML = html;
}

function renderConditionalTable(xCats, fCats, O, rowTotals, colTotals, N) {
  let html = `<table class="log-table"><thead><tr><th>P(F | X)</th>`;
  fCats.forEach(f => { html += `<th>P(${f} | X)</th>`; });
  html += `<th>Row Sum</th></tr></thead><tbody>`;

  for (let i = 0; i < xCats.length; i++) {
    html += `<tr><td><strong>X = ${xCats[i]}</strong></td>`;
    for (let j = 0; j < fCats.length; j++) {
      const condProb = rowTotals[i] > 0 ? O[i][j] / rowTotals[i] : 0;
      html += `<td>${condProb.toFixed(4)}</td>`;
    }
    html += `<td>1.0000</td></tr>`;
  }

  html += `<tr style="background:#f1f5f9;"><td><strong>Marginal P(F)</strong></td>`;
  for (let j = 0; j < fCats.length; j++) {
    html += `<td><strong>${(colTotals[j] / N).toFixed(4)}</strong></td>`;
  }
  html += `<td><strong>1.0000</strong></td></tr></tbody></table>`;

  document.getElementById("conditionalTableContainer").innerHTML = html;
}

function renderExpectedTable(xCats, fCats, E, rowTotals, colTotals, N) {
  let html = `<table class="log-table"><thead><tr><th>Expected E<sub>ij</sub></th>`;
  fCats.forEach(f => { html += `<th>${f}</th>`; });
  html += `<th>Row Total</th></tr></thead><tbody>`;

  for (let i = 0; i < xCats.length; i++) {
    html += `<tr><td><strong>${xCats[i]}</strong></td>`;
    for (let j = 0; j < fCats.length; j++) {
      html += `<td>${E[i][j].toFixed(2)}</td>`;
    }
    html += `<td>${rowTotals[i]}</td></tr>`;
  }

  html += `<tr style="background:#f1f5f9;"><td><strong>Col Total</strong></td>`;
  for (let j = 0; j < fCats.length; j++) {
    html += `<td>${colTotals[j]}</td>`;
  }
  html += `<td><strong>${N}</strong></td></tr></tbody></table>`;

  document.getElementById("expectedTableContainer").innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  const presetSelect = document.getElementById("datasetPreset");
  const textarea = document.getElementById("bivariateInput");
  const analyzeBtn = document.getElementById("analyzeBtn");

  textarea.value = PRESETS[presetSelect.value];

  presetSelect.addEventListener("change", () => {
    textarea.value = PRESETS[presetSelect.value];
    analyzeBivariateData();
  });

  analyzeBtn.addEventListener("click", analyzeBivariateData);

  analyzeBivariateData();
});