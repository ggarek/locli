const bigString = '                                   '; // String repeat with symbol?
function padLeft(str, length) {
  return (bigString + str).slice(-1 * Math.max(str.length, length));
}

function padRight(str, length) {
  return (str + bigString).slice(0, Math.max(str.length, length));
}

module.exports = {
  padLeft,
  padRight,
};