let minerals = [];
let currentMineral = null;
let allLocations = [];

const mineralSearch = document.getElementById('mineralSearch');
const suggestionsDiv = document.getElementById('suggestions');
const locationSelect = document.getElementById('locationSelect');

const luckInput = document.getElementById('luckInput');
const capacityInput = document.getElementById('capacityInput');
const digStrengthInput = document.getElementById('digStrengthInput');
const digSpeedInput = document.getElementById('digSpeedInput');
const shakeStrengthInput = document.getElementById('shakeStrengthInput');
const shakeSpeedInput = document.getElementById('shakeSpeedInput');

const rarityDot = document.getElementById('rarityDot');
const mineralLabel = document.getElementById('mineralLabel');
const rarityTag = document.getElementById('rarityTag');
const bestLocation = document.getElementById('bestLocation');

const chanceCell = document.getElementById('chanceCell');
const oneInAttempt = document.getElementById('oneInAttempt');
const expectedCell = document.getElementById('expectedCell');
const expectedSub = document.getElementById('expectedSub');
const attempts50Cell = document.getElementById('attempts50Cell');
const attempts90Cell = document.getElementById('attempts90Cell');
const attempts99Cell = document.getElementById('attempts99Cell');
const time50Cell = document.getElementById('time50Cell');
const time90Cell = document.getElementById('time90Cell');
const time99Cell = document.getElementById('time99Cell');
const locationTable = document.getElementById('locationTable');

fetch('./minerals.json')
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(data => {
    const raw = Object.values(data);
    minerals = raw.map(m => ({
      mineral: m.name,
      rarity: m.rarity || 'unknown',
      locations: parseLocations(m.data)
    }));
    allLocations = minerals.slice();
    if (minerals.length) {
      const first = minerals[0];
      currentMineral = first;
      updateMineralUI(first);
      updateLocationDropdown(first);
      calculate();
    }
  })
  .catch(err => {
    console.error('Load error:', err);
    mineralLabel.textContent = 'Load failed';
  });

function parseLocations(text) {
  const lines = text.split('\n');
  const out = [];
  let found = false;
  for (const line of lines) {
    if (line.includes('**Locations & Chances**')) { found = true; continue; }
    if (!found) continue;
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(' - ');
    if (parts.length < 2) continue;
    const chance = parseFloat(parts[1].replace('%', '')) || 0;
    out.push({ location: parts[0].trim(), chance_percent: chance });
  }
  return out;
}

function rarityColor(r) {
  switch (r?.toLowerCase()) {
    case 'common': return '#a3a3a3';
    case 'uncommon': return '#22c55e';
    case 'rare': return '#3b82f6';
    case 'epic': return '#a855f7';
    case 'legendary': return '#f59e0b';
    default: return '#7c8cff';
  }
}

function shakeSpeedToR(x) {
  x = Math.max(0, Number(x) || 0);
  x = Math.min(x, 3000);
  return (4.03266e-9 * Math.pow(x, 3)) -
         (1.68935e-5 * Math.pow(x, 2)) +
         (0.0255557 * x) +
         0.206594;
}

function fmtDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '∞';
  if (seconds === Infinity) return '∞';
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + sec + 's';
  return sec + 's';
}

function attemptsForTarget(pAttempt, target) {
  if (!isFinite(pAttempt) || pAttempt <= 0) return Infinity;
  if (pAttempt >= 1) return 1;
  return Math.log(1 - target) / Math.log(1 - pAttempt);
}

function updateMineralUI(mineral) {
  currentMineral = mineral;
  mineralLabel.textContent = mineral.mineral;
  rarityTag.textContent = mineral.rarity;
  rarityDot.style.background = rarityColor(mineral.rarity);

  const best = mineral.locations.reduce((a, b) =>
    a.chance_percent > b.chance_percent ? a : b
  );
  bestLocation.textContent = best.location;
}

function updateLocationDropdown(mineral) {
  locationSelect.innerHTML = '';
  mineral.locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc.chance_percent;
    opt.textContent = loc.location;
    locationSelect.appendChild(opt);
  });
  if (mineral.locations.length) {
    locationSelect.value = mineral.locations[0].chance_percent;
  }
}

mineralSearch.addEventListener('input', function() {
  const query = this.value.toLowerCase().trim();
  if (!query) {
    suggestionsDiv.classList.remove('active');
    return;
  }

  const matches = allLocations.filter(m =>
    m.mineral.toLowerCase().includes(query)
  ).slice(0, 8);

  if (matches.length === 0) {
    suggestionsDiv.classList.remove('active');
    return;
  }

  suggestionsDiv.innerHTML = '';
  matches.forEach(m => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.textContent = m.mineral;
    div.addEventListener('click', () => {
      mineralSearch.value = m.mineral;
      suggestionsDiv.classList.remove('active');
      currentMineral = m;
      updateMineralUI(m);
      updateLocationDropdown(m);
      calculate();
    });
    suggestionsDiv.appendChild(div);
  });
  suggestionsDiv.classList.add('active');
});

document.addEventListener('click', function(e) {
  if (!suggestionsDiv.contains(e.target) && e.target !== mineralSearch) {
    suggestionsDiv.classList.remove('active');
  }
});

locationSelect.addEventListener('change', calculate);
luckInput.addEventListener('input', calculate);
capacityInput.addEventListener('input', calculate);
digStrengthInput.addEventListener('input', calculate);
digSpeedInput.addEventListener('input', calculate);
shakeStrengthInput.addEventListener('input', calculate);
shakeSpeedInput.addEventListener('input', calculate);

function calculate() {
  if (!currentMineral) return;

  const luck = parseFloat(luckInput.value) || 0;
  const C = parseFloat(capacityInput.value) || 1;
  const digStrength = parseFloat(digStrengthInput.value) || 0;
  const digSpeed = parseFloat(digSpeedInput.value) || 0.01;
  const shakeStrength = parseFloat(shakeStrengthInput.value) || 0;
  const shakeSpeed = parseFloat(shakeSpeedInput.value) || 0;

  const rolls = luck * Math.sqrt(C);

  const r = shakeSpeedToR(shakeSpeed);
  const rs = r * shakeStrength;

  let cycleSeconds = Infinity;
  if (rs > 0) {
    cycleSeconds = C / rs + 0.75 + 190 * (Math.max(0, digStrength - 1)) / digSpeed;
  }

  const basePercent = parseFloat(locationSelect.value) || 0;
  const p = basePercent / 100;

  const pAttempt = 1 - Math.pow(1 - p, rolls);
  const expected = rolls * p;

  const a50 = attemptsForTarget(pAttempt, 0.50);
  const a90 = attemptsForTarget(pAttempt, 0.90);
  const a99 = attemptsForTarget(pAttempt, 0.99);

  const t50 = isFinite(a50) && isFinite(cycleSeconds) ? a50 * cycleSeconds : Infinity;
  const t90 = isFinite(a90) && isFinite(cycleSeconds) ? a90 * cycleSeconds : Infinity;
  const t99 = isFinite(a99) && isFinite(cycleSeconds) ? a99 * cycleSeconds : Infinity;

  chanceCell.textContent = (pAttempt * 100).toFixed(5) + '%';
  oneInAttempt.textContent = '~1 in ' + (pAttempt > 0 ? Math.round(1 / pAttempt).toLocaleString() : '∞');
  expectedCell.textContent = expected.toFixed(4);
  expectedSub.textContent = 'per attempt';

  attempts50Cell.textContent = isFinite(a50) ? Math.round(a50).toLocaleString() : '∞';
  attempts90Cell.textContent = isFinite(a90) ? Math.round(a90).toLocaleString() : '∞';
  attempts99Cell.textContent = isFinite(a99) ? Math.round(a99).toLocaleString() : '∞';

  time50Cell.textContent = fmtDuration(t50);
  time90Cell.textContent = fmtDuration(t90);
  time99Cell.textContent = fmtDuration(t99);

  locationTable.innerHTML = '';
  const sorted = [...currentMineral.locations].sort((a, b) => b.chance_percent - a.chance_percent);
  for (const loc of sorted) {
    const bp = loc.chance_percent / 100;
    const pLoc = 1 - Math.pow(1 - bp, rolls);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${loc.location}</td>
      <td>${loc.chance_percent.toFixed(8)}%</td>
      <td>${(pLoc * 100).toFixed(5)}%</td>
      <td>~1 in ${pLoc > 0 ? Math.round(1 / pLoc).toLocaleString() : '∞'}</td>
    `;
    locationTable.appendChild(tr);
  }
}
