const pRange = document.getElementById('pRange');
const stepsRange = document.getElementById('stepsRange');
const walksRange = document.getElementById('walksRange');
const pVal = document.getElementById('pVal');
const stepsVal = document.getElementById('stepsVal');
const walksVal = document.getElementById('walksVal');
const runBtn = document.getElementById('runBtn');

let chart = null;

// Aggiorna le etichette numeriche accanto agli slider mentre li muovi
pRange.oninput = () => pVal.textContent = parseFloat(pRange.value).toFixed(2);
stepsRange.oninput = () => stepsVal.textContent = stepsRange.value;
walksRange.oninput = () => walksVal.textContent = walksRange.value;

// Genera un colore diverso per ogni traiettoria
function randomColor(i) {
  const hue = (i * 47) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

// Genera i dati e (ri)disegna il grafico
function runSimulation() {
  const p = parseFloat(pRange.value);
  const steps = parseInt(stepsRange.value);
  const nWalks = parseInt(walksRange.value);

  const labels = Array.from({ length: steps + 1 }, (_, i) => i);
  const datasets = [];

  for (let w = 0; w < nWalks; w++) {
    let successes = 0;
    const data = [0];
    for (let i = 1; i <= steps; i++) {
      if (Math.random() < p) successes++;
      data.push(successes / i);
    }
    datasets.push({
      label: `Traiettoria ${w + 1}`,
      data: data,
      borderColor: randomColor(w),
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false
    });
  }

  // Linea rossa tratteggiata che indica la probabilità teorica p
  datasets.push({
    label: `p = ${p}`,
    data: labels.map(() => p),
    borderColor: '#e53935',
    borderDash: [6, 4],
    borderWidth: 2,
    pointRadius: 0,
    fill: false
  });

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById('rwChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: 'Numero di prove (n)' } },
        y: { title: { display: true, text: 'Frequenza relativa fₙ' }, min: 0, max: 1 }
      }
    }
  });
}

runBtn.addEventListener('click', runSimulation);
runSimulation(); // esegui subito al caricamento della pagina
