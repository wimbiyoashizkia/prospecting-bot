const normalizedCache = new Map();

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z]/g, "");
}

function getNormalized(key) {
  if (!normalizedCache.has(key)) {
    normalizedCache.set(key, normalize(key));
  }
  return normalizedCache.get(key);
}

function isSubsequence(input, target) {
  let i = 0;
  let j = 0;

  while (i < input.length && j < target.length) {
    if (input[i] === target[j]) i++;
    j++;
  }

  return i === input.length;
}

function levenshtein(a, b) {
  const matrix = Array.from(
    { length: b.length + 1 },
    (_, i) => [i]
  );

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findClosestMineral(input, minerals) {
  const cleanInput = normalize(input);

  if (cleanInput.length < 2) {
    return {
      found: false,
      suggestions: []
    };
  }

  const candidates = [];
  const keys = Object.keys(minerals);

  for (const key of keys) {
    const cleanName = getNormalized(key);

    if (cleanName === cleanInput) {
      return {
        found: true,
        name: key,
        score: 100,
        suggestions: []
      };
    }

    let score = 0;

    if (cleanName.startsWith(cleanInput)) {
      score = 100;
    } else if (isSubsequence(cleanInput, cleanName)) {
      score = 90 - (cleanName.length - cleanInput.length);
    } else {
      const distance = levenshtein(cleanInput, cleanName);

      if (distance <= 2) {
        score = 80 - (distance * 10);
      }
    }

    if (score > 0) {
      candidates.push({
        name: key,
        score
      });
    }
  }

  if (candidates.length === 0) {
    return {
      found: false,
      suggestions: []
    };
  }

  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];

  if (best.score < 50) {
    return {
      found: false,
      suggestions: candidates.slice(0, 3)
    };
  }

  if (best.score >= 85) {
    return {
      found: true,
      name: best.name,
      score: best.score,
      suggestions: candidates
        .filter(x => x.name !== best.name && x.score >= 50)
        .slice(0, 3)
    };
  }

  return {
    found: false,
    suggestions: candidates.slice(0, 3)
  };
}

module.exports = findClosestMineral;
