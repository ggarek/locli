const fs = require('fs');
const path = require('path');
const {padRight} = require('./utils/string');

function print(key, options) {
  const {
    path: localesPath,
    indentation
  } = options;

  const files = fs.readdirSync(localesPath);
  const values = [];

  // Gather info
  for (let i = 0; i < files.length; i++) {
    const fileName = path.resolve(path.join(localesPath, files[i]));
    const content = JSON.parse(fs.readFileSync(fileName));

    values.push([files[i], content[key]]);
  }

  // Print info
  const maxFileNameLength = values.reduce((a, [b]) => Math.max(a, b.length), 0);
  console.log(`Key ${key}`);
  console.log('----------');
  values.map(([fileName, value]) => {
    console.log(`${padRight(fileName, maxFileNameLength)}\t${value}`);
  });

  process.exit(0);
}

module.exports = print;