/* ==========================================================================
   SHOR'S QUANTUM ALGORITHM & PERIOD-FINDING INTERACTIVE EXPLORER
   Interactive Cryptanalysis Engine demonstrating quantum breakdown of RSA
   Author: Bilisuma Jabesa Merga Portfolio (SSRN: 4992090)
   ========================================================================== */

(function () {
  'use strict';

  // Greatest Common Divisor using Euclidean Algorithm
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      let t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  // Modular Exponentiation: (base^exp) % mod
  function modPow(base, exp, mod) {
    let res = 1;
    base = base % mod;
    while (exp > 0) {
      if (exp % 2 === 1) res = (res * base) % mod;
      base = (base * base) % mod;
      exp = Math.floor(exp / 2);
    }
    return res;
  }

  // Find period r where a^r = 1 (mod N)
  function findPeriod(a, N) {
    if (gcd(a, N) !== 1) return null;
    let r = 1;
    let cur = (a % N);
    while (cur !== 1 && r < 200) {
      cur = (cur * a) % N;
      r++;
    }
    return cur === 1 ? r : null;
  }

  // DOM Elements
  const selModulus = document.getElementById('shor-modulus');
  const selBase = document.getElementById('shor-base');
  const btnCalculate = document.getElementById('btn-run-shor');
  const graphContainer = document.getElementById('shor-graph-bars');
  const resultContainer = document.getElementById('shor-results-output');

  // Populate valid coprime bases when N changes
  function updateCoprimeOptions() {
    if (!selModulus || !selBase) return;
    const N = parseInt(selModulus.value, 10);
    selBase.innerHTML = '';

    const validBases = [];
    for (let a = 2; a < N; a++) {
      if (gcd(a, N) === 1) {
        validBases.push(a);
      }
    }

    validBases.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a;
      opt.textContent = `Base a = ${a} (coprime to ${N})`;
      selBase.appendChild(opt);
    });

    // Default to a good base if available
    if (validBases.includes(7)) {
      selBase.value = 7;
    } else if (validBases.length > 0) {
      selBase.value = validBases[0];
    }
  }

  function runShorSimulation() {
    if (!selModulus || !selBase || !graphContainer || !resultContainer) return;

    const N = parseInt(selModulus.value, 10);
    const a = parseInt(selBase.value, 10);

    // Step 1: Classical check for trivial factors
    const g = gcd(a, N);
    if (g > 1) {
      resultContainer.innerHTML = `
        <div class="shor-step-item" style="color: #f59e0b;">
          <strong>Trivial Factor Found:</strong> gcd(${a}, ${N}) = ${g}. Since ${g} divides ${N}, no quantum search is needed! Factors: ${g} and ${N / g}.
        </div>`;
      return;
    }

    // Step 2: Compute period r
    const r = findPeriod(a, N);
    if (!r) {
      resultContainer.innerHTML = `<div class="shor-step-item" style="color: #f43f5e;">Unable to find period r within search limits.</div>`;
      return;
    }

    // Step 3: Generate sequence for visualization
    const maxSamples = Math.min(r * 3 + 2, 24);
    const sequence = [];
    for (let x = 0; x < maxSamples; x++) {
      sequence.push({ x, val: modPow(a, x, N) });
    }

    // Render bars in graph
    graphContainer.innerHTML = '';
    const maxVal = Math.max(...sequence.map(s => s.val), 1);

    sequence.forEach((pt, idx) => {
      const isPeriodStart = (pt.x % r === 0);
      const barItem = document.createElement('div');
      barItem.className = 'period-bar-item';
      
      const heightPercent = Math.max((pt.val / maxVal) * 100, 10);
      
      const barFill = document.createElement('div');
      barFill.className = 'period-bar-fill';
      barFill.style.height = `${heightPercent}%`;
      if (isPeriodStart) {
        barFill.style.background = 'linear-gradient(180deg, #38bdf8, #2563eb)';
        barFill.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.5)';
      }

      const label = document.createElement('span');
      label.className = 'period-bar-label';
      label.textContent = pt.val;

      const xLabel = document.createElement('span');
      xLabel.style.fontSize = '9px';
      xLabel.style.color = isPeriodStart ? '#38bdf8' : '#64748b';
      xLabel.textContent = `x=${pt.x}`;

      barItem.appendChild(label);
      barItem.appendChild(barFill);
      barItem.appendChild(xLabel);
      graphContainer.appendChild(barItem);
    });

    // Step 4: Quantum Post-Processing (RSA Factorization)
    let stepsHtml = `
      <div class="shor-step-item">
        <strong>1. Periodic Function:</strong> f(x) = ${a}<sup>x</sup> mod ${N} repeats with period <strong>r = ${r}</strong>.
      </div>
      <div class="shor-step-item">
        <strong>2. Quantum Fourier Transform:</strong> QFT evaluates the periodic phase interference on an ${Math.ceil(Math.log2(N * N))}-qubit register in polynomial time 𝒪((log N)³).
      </div>
    `;

    if (r % 2 === 0) {
      const halfR = r / 2;
      const xVal = modPow(a, halfR, N);

      if (xVal !== N - 1 && xVal !== 1) {
        const factor1 = gcd(xVal - 1, N);
        const factor2 = gcd(xVal + 1, N);
        const nonTrivial = [factor1, factor2].filter(f => f > 1 && f < N);

        stepsHtml += `
          <div class="shor-step-item">
            <strong>3. Period Parity Check:</strong> r = ${r} is even! Evaluate a<sup>r/2</sup> mod ${N} = ${a}<sup>${halfR}</sup> mod ${N} = <strong>${xVal}</strong>.
          </div>
          <div class="shor-step-item">
            <strong>4. Euclid GCD Prime Factor Extraction:</strong><br>
            • gcd(${xVal} - 1, ${N}) = <strong>${factor1}</strong><br>
            • gcd(${xVal} + 1, ${N}) = <strong>${factor2}</strong>
          </div>
          <div class="shor-step-item" style="color:#10b981; font-weight:700; background:rgba(16,185,129,0.12); padding:0.5rem; border-radius:4px; margin-top:0.4rem;">
            ✓ SUCCESS: RSA modulus ${N} factored into primes ${factor1} × ${factor2} = ${factor1 * factor2}!
          </div>
        `;
      } else {
        stepsHtml += `
          <div class="shor-step-item" style="color:#f59e0b;">
            r is even, but a<sup>r/2</sup> ≡ -1 (mod ${N}). This is a degenerate case. Try another coprime base a.
          </div>
        `;
      }
    } else {
      stepsHtml += `
        <div class="shor-step-item" style="color:#f59e0b;">
          Period r = ${r} is odd. Shor's algorithm repeats quantum sampling with another coprime base a.
        </div>
      `;
    }

    resultContainer.innerHTML = stepsHtml;
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    if (selModulus) {
      selModulus.addEventListener('change', () => {
        updateCoprimeOptions();
        runShorSimulation();
      });
      updateCoprimeOptions();
    }

    if (selBase) {
      selBase.addEventListener('change', runShorSimulation);
    }

    if (btnCalculate) {
      btnCalculate.addEventListener('click', runShorSimulation);
    }

    // Auto-run once on load
    setTimeout(runShorSimulation, 300);
  });
})();
