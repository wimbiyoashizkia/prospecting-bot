const similarity = require("string-similarity");

function findClosestMineral(input, minerals) {
  const names = Object.keys(minerals);

  const match = similarity.findBestMatch(
    input.toLowerCase(),
    names
  );

  if (match.bestMatch.rating < 0.4) {
    return null;
  }

  return match.bestMatch.target;
}

module.exports = findClosestMineral;
