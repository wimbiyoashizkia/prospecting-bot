const similarity = require("string-similarity");

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z]/g, "");
}

function consonantOnly(str) {
  return str.replace(/[aeiou]/g, "");
}

function findClosestMineral(input, minerals) {
  const names = Object.keys(minerals);

  const cleanInput = normalize(input);

  if (cleanInput.length < 2) {
    return null;
  }

  const inputC = consonantOnly(cleanInput);

  let bestMatch = null;
  let bestScore = 0;

  for (const name of names) {
    const cleanName = normalize(name);
    const nameC = consonantOnly(cleanName);

    if (cleanName === cleanInput) {
      return name;
    }

    let score = similarity.compareTwoStrings(cleanInput, cleanName);

    if (cleanName.startsWith(cleanInput)) {
      score += 1;
    }

    if (
      inputC.length >= 2 &&
      nameC.startsWith(inputC)
    ) {
      score += 0.8;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = name;
    }
  }

  if (bestScore >= 0.6) {
    return bestMatch;
  }

  return null;
}

module.exports = findClosestMineral;
