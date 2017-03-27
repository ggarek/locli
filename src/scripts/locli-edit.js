const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const readline = require('readline');
const {padRight} = require('./utils/string');

// TODO: user config
const EDITOR = 'vim';

function createEditBuffer(key, entries) {
  let buffer = '';
  buffer += `# You are about to edit a key "${key}"\n`;
  buffer += '# Empty line, or lines starting with "#" will be skipped\n';
  buffer += '#------------------------------------\n';
  buffer += '\n';

  const maxFileLength = entries.reduce((a,[b]) => Math.max(a, b.length), 0);
  entries.forEach(([file, value]) => {
    buffer += `${padRight(file, maxFileLength)}\t${value}`;
    buffer += '\n';
  });

  buffer += '\n';
  buffer += `# Please do not add/remove lines. It is not allowed and edit will fail`;

  return buffer;
}

function applyChanges(key, entries, context) {
  for (let i = 0; i < entries.length; i++) {
    const [file, newValue] = entries[i];
    const fileName = path.resolve(path.join(context.path, file));
    const content = JSON.parse(fs.readFileSync(fileName));
    content[key] = newValue;
    fs.writeFileSync(fileName, JSON.stringify(content, null, context.indentation));
  }
}

function locliEdit(key, options) {
  const localesPath = options.path;
  const indentation = options.indentation;
  const files = fs.readdirSync(localesPath);

  const entries = [];
  for (let i = 0; i < files.length; i++) {
    const fileName = path.resolve(path.join(localesPath, files[i]));
    const content = JSON.parse(fs.readFileSync(fileName));

    const value = content.hasOwnProperty(key) ? content[key] : '.';
    entries.push([files[i], value]);
  }

  const buffer = createEditBuffer(key, entries);
  const editFile = './\~locli.edit';
  fs.writeFileSync(editFile, buffer);
  const editor = childProcess.spawn(EDITOR, [editFile], {stdio: 'inherit'});
  editor.on('close', code => {
    // TODO: may check edit buffer md5, and if it is the same - do not apply changes
    console.log(`${EDITOR} exit code is`, code);
    if (code === 0) {
      handleEditComplete();
    } else {
      console.log('editor process exit with error.. aborting edit');
    }

  });
  editor.on('error', (...args) => console.log('Editor process error', args));
  editor.on('data', (...args) => console.log('Editor process data', args));

  function handleEditComplete() {
    const editedEntries = [];

    const parseLine = line => {
      let separatorIdx = line.indexOf('\t');
      // if (separatorIdx === -1) separatorIdx = line.indexOf('\t');
      if (separatorIdx === -1) {
        console.log(`failed to parse a line\n${line}`);
        process.exit(1);
      }
      const fileName = line.substr(0, separatorIdx).trim();
      const value = line.substr(separatorIdx + 1).trim();
      return [fileName, value];
    };

    const rl = readline.createInterface({
      input: fs.createReadStream(editFile)
    });

    // Read edited info
    rl.on('line', line => {
      const trimmed = line && line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      editedEntries.push(parseLine(line));
    });

    rl.on('close', () => {
      if (files.length !== editedEntries.length) {
        console.log('Error');
        console.log('altering number of lines is not allowed');
        console.log(`${files.length} are being edited, but ${editedEntries.length} are submitted`);
        process.exit(1);
      }

      applyChanges(key, editedEntries, options);
    });
  }
}

module.exports = locliEdit;
