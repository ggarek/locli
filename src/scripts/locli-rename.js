const fs = require('fs');
const path = require('path');

function rename(oldKey, newKey, options) {
  const {
    path: localesPath,
    indentation
  } = options;

  const files = fs.readdirSync(localesPath);

  for (let i = 0; i < files.length; i++) {
    const fileName = path.resolve(path.join(localesPath, files[i]));
    const content = JSON.parse(fs.readFileSync(fileName));

    // rename logic, but the cycle is pretty generic for now
    const value = content[oldKey];
    delete content[oldKey];
    content[newKey] = value;

    fs.writeFileSync(fileName, JSON.stringify(content, null, indentation));
  }

  process.exit(0);
}

module.exports = rename;