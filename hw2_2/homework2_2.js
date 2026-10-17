// --- Part 1: Caesar Cipher & Statistical Cryptanalysis ---

const ENGLISH_FREQ = {
  A: 0.08167, B: 0.01492, C: 0.02782, D: 0.04253, E: 0.12702,
  F: 0.02228, G: 0.02015, H: 0.06094, I: 0.06966, J: 0.00153,
  K: 0.00772, L: 0.04025, M: 0.02406, N: 0.06749, O: 0.07507,
  P: 0.01929, Q: 0.00095, R: 0.05987, S: 0.06327, T: 0.09056,
  U: 0.02758, V: 0.00978, W: 0.02360, X: 0.00150, Y: 0.01974, Z: 0.00074
};

function caesarEncrypt(text, shift) {
  return text.toUpperCase().replace(/[A-Z]/g, (char) => {
    return String.fromCharCode(((char.charCodeAt(0) - 65 + shift) % 26) + 65);
  });
}

function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, (26 - (shift % 26)) % 26);
}

function computeChiSquare(ciphertext, shiftCandidate) {
  const decrypted = caesarDecrypt(ciphertext, shiftCandidate);
  const counts = {};
  let totalLetters = 0;

  for (let c of decrypted) {
    if (c >= 'A' && c <= 'Z') {
      counts[c] = (counts[c] || 0) + 1;
      totalLetters++;
    }
  }

  if (totalLetters === 0) return Infinity;

  let chiSq = 0;
  for (let letter in ENGLISH_FREQ) {
    let observed = counts[letter] || 0;
    let expected = totalLetters * ENGLISH_FREQ[letter];
    chiSq += Math.pow(observed - expected, 2) / (expected || 1);
  }

  return chiSq;
}

function crackCaesar(ciphertext) {
  let bestShift = 0;
  let minChiSq = Infinity;

  for (let shift = 0; shift < 26; shift++) {
    let chiSq = computeChiSquare(ciphertext, shift);
    if (chiSq < minChiSq) {
      minChiSq = chiSq;
      bestShift = shift;
    }
  }

  return bestShift;
}

function runCaesarAnalysis() {
  const text = document.getElementById('caesarInput').value;
  const shift = parseInt(document.getElementById('caesarShift').value);

  const ciphertext = caesarEncrypt(text, shift);
  document.getElementById('caesarCiphertext').innerText = ciphertext;

  const recoveredKey = crackCaesar(ciphertext);
  document.getElementById('recoveredKeyDisplay').innerText = `${recoveredKey} ${recoveredKey === shift ? '✓ (Correct)' : '✗ (Failed)'}`;
  document.getElementById('decryptedCaesar').innerText = caesarDecrypt(ciphertext, recoveredKey);

  testLengthEffectiveness(text, shift);
}

function testLengthEffectiveness(fullText, trueShift) {
  const tbody = document.querySelector('#lengthTestTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const cleanText = fullText.toUpperCase().replace(/[^A-Z]/g, '');
  const sampleLengths = [5, 15, 30, 60, 120];

  sampleLengths.forEach(len => {
    let sample = cleanText.substring(0, Math.min(len, cleanText.length));
    if (sample.length === 0) return;

    let cipherSample = caesarEncrypt(sample, trueShift);
    let predictedKey = crackCaesar(cipherSample);
    let isCorrect = predictedKey === trueShift;

    tbody.innerHTML += `
      <tr>
        <td><strong>${sample.length} chars</strong></td>
        <td><code>${cipherSample.substring(0, 20)}...</code></td>
        <td>Key ${predictedKey}</td>
        <td><span style="color: ${isCorrect ? '#16a34a' : '#dc2626'}; font-weight: bold;">${isCorrect ? 'SUCCESS' : 'FAILED'}</span></td>
      </tr>
    `;
  });
}

// --- Part 2: Toy ECC Arithmetic & Restricted Key Space Attack ---

const P = 17, A = 0, B = 7;

function mod(n, m) { return ((n % m) + m) % m; }

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

  let x1 = P1.x, y1 = P1.y, x2 = P2.x, y2 = P2.y;
  if (x1 === x2 && mod(y1 + y2, P) === 0) return null;

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

function pointSub(P1, P2) {
  if (!P2) return P1;
  let negP2 = { x: P2.x, y: mod(-P2.y, P) };
  return pointAdd(P1, negP2);
}

function scalarMultiply(k, G) {
  let current = null;
  let temp = G;
  while (k > 0) {
    if (k & 1) current = pointAdd(current, temp);
    temp = pointAdd(temp, temp);
    k >>= 1;
  }
  return current;
}

function runEccDemo() {
  const G = { x: 1, y: 5 };
  const k = parseInt(document.getElementById('eccPrivKey').value);
  const r = parseInt(document.getElementById('eccEphKey').value);
  const mIndex = parseInt(document.getElementById('eccMsgVal').value);

  // Key Gen
  const Q = scalarMultiply(k, G);
  document.getElementById('eccPubKeyDisplay').innerText = Q ? `(${Q.x}, ${Q.y})` : 'O';

  // Encryption
  const C1 = scalarMultiply(r, G); // rG
  const S = scalarMultiply(r, Q);  // rQ
  const M = scalarMultiply(mIndex, G); // Message Point
  const C2 = pointAdd(M, S); // M + rQ

  document.getElementById('eccC1Display').innerText = C1 ? `(${C1.x}, ${C1.y})` : 'O';
  document.getElementById('eccSDisplay').innerText = S ? `(${S.x}, ${S.y})` : 'O';
  document.getElementById('eccC2Display').innerText = C2 ? `(${C2.x}, ${C2.y})` : 'O';

  // Decryption: C2 - k*C1
  const kC1 = scalarMultiply(k, C1);
  const decryptedM = pointSub(C2, kC1);
  document.getElementById('eccDecryptedDisplay').innerText = decryptedM ? `Point (${decryptedM.x}, ${decryptedM.y})` : 'O';

  // Attack: Restricted Key Space Attack (Brute Force ECDLP)
  let steps = 0;
  let recoveredK = null;

  for (let candidateK = 1; candidateK <= 18; candidateK++) {
    steps++;
    let testQ = scalarMultiply(candidateK, G);
    if (testQ && Q && testQ.x === Q.x && testQ.y === Q.y) {
      recoveredK = candidateK;
      break;
    }
  }

  document.getElementById('eccAttackStatus').innerText = recoveredK ? 'Key Successfully Extracted!' : 'Attack Failed';
  document.getElementById('eccAttackSteps').innerText = `${steps} evaluations out of 18 possible keys`;
  document.getElementById('eccAttackKey').innerText = recoveredK ? `k = ${recoveredK}` : 'Not Found';
}

document.addEventListener('DOMContentLoaded', () => {
  const caesarBtn = document.getElementById('encryptCaesarBtn');
  const eccBtn = document.getElementById('runEccBtn');

  if (caesarBtn) caesarBtn.addEventListener('click', runCaesarAnalysis);
  if (eccBtn) eccBtn.addEventListener('click', runEccDemo);

  runCaesarAnalysis();
  runEccDemo();
});