const fs = require('fs');
const path = require('path');

function removeKey(key, options) {
  const {
    path: localesPath,
    indentation
  } = options;

  const files = fs.readdirSync(localesPath);

  for (let i = 0; i < files.length; i++) {
    const fileName = path.resolve(path.join(localesPath, files[i]));
    const content = JSON.parse(fs.readFileSync(fileName));
    delete content[key];
    fs.writeFileSync(fileName, JSON.stringify(content, null, indentation));
  }
  
  process.exit(0);
}

module.exports = removeKey;