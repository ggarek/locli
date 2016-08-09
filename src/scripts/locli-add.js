'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {padRight} = require('./utils/string');


function locliAddInteractive(key, options) {
  const localesPath = options.path;
  const indentation = options.indentation;

  // Start
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const files = fs.readdirSync(localesPath);
  let i = 0;
  let file = files[i];
  const values = [];

  const applyChanges = () => {
    for (let k = 0; k < files.length; k++) {
      // TODO: it may be refactored to a function (and used in several places; can handle overwrite etc)
      const fileName = path.resolve(path.join(localesPath, files[k]));
      const content = JSON.parse(fs.readFileSync(fileName));
      content[key] = values[k];
      fs.writeFileSync(fileName, JSON.stringify(content, null, indentation));
    }

    rl.close();
  };

  const complete = () => {
    console.log('Check entered data, please:');
    console.log(`key: ${key}\n---\n`);
    const maxFileNameLength = files.reduce((a, b) => Math.max(a, b.length), 0);

    for (let j = 0; j < files.length; j++) {
      console.log(`${padRight(files[j], maxFileNameLength)}\t${values[j]}`);
    }
    console.log('Is everything ok? (yes)');
    rl.on('line', (line) => {
      if (line.trim().toLowerCase() === 'yes') applyChanges();
  else rl.close();
  });
  };

  const next = (answer) => {
    if (!answer) {
      rl.question(`[${file}] Enter value for ${key}\n`, next);
    } else {
      i++;
      file = files[i];
      values.push(answer);
      if (file) {
        rl.question(`[${file}] Enter value for ${key}\n`, next);
      } else {
        console.log('my work here is done!');
        complete();
      }
    }
  };

  next();
}

function locliAddWrapper(key, options) {
  if (options.interactive) {
    console.log('adding key interactively', key);
    locliAddInteractive(key, options);
  } else {
    console.log('locli supports only interactive mode (-i) for now');
    process.exit(1);
  }
}

module.exports = locliAddWrapper;