const similarity = require("string-similarity");

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z]/g, "");
}

function isSubsequence(input, target) {
  let i = 0;
  let j = 0;

  while (i < input.length && j < target.length) {
    if (input[i] === target[j]) {
      i++;
    }
    j++;
  }

  return i === input.length;
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

  for (const key of Object.keys(minerals)) {
    const cleanName = normalize(key);

    if (cleanName === cleanInput) {
      return {
        found: true,
        name: key
      };
    }

    let score = 0;

    if (cleanName.startsWith(cleanInput)) {
      score = 100;
    } else if (isSubsequence(cleanInput, cleanName)) {
      score = 90 - (cleanName.length - cleanInput.length);
    } else {
      const fuzzy = similarity.compareTwoStrings(cleanInput, cleanName);

      if (fuzzy >= 0.5) {
        score = fuzzy * 50;
      }
    }

    candidates.push({
      name: key,
      score
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0 || candidates[0].score < 25) {
    return {
      found: false,
      suggestions: candidates
        .slice(0, 3)
        .map(x => x.name)
    };
  }

  return {
    found: true,
    name: candidates[0].name,
    suggestions: candidates
      .slice(1, 4)
      .map(x => x.name)
  };
}

module.exports = findClosestMineral;
