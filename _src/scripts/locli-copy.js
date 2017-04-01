// TODO: add flag to skip editing
// TODO: warn rewrite if newKey is present (or add force flag)

const pify = require('pify');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const readline = require('readline');
const {padRight} = require('./utils/string');

const pfs = pify(fs);

// TODO: user config
const EDITOR = 'vim';

function loadVocabularies(localesPath) {
  const files = fs.readdirSync(localesPath);

  const entries = [];
  for (let i = 0; i < files.length; i++) {
    const fileName = path.resolve(path.join(localesPath, files[i]));
    const data = JSON.parse(fs.readFileSync(fileName));

    entries.push({
      file: files[i],
      path: fileName,
      data,
    });
  }

  return entries;
}

function createBuffer(oldKey, newKey, entries) {
  let buffer = '';
  buffer += `# You copy "${oldKey}" to new key "${newKey}"\n`;
  buffer += '# Empty line, or lines starting with "#" will be skipped\n';
  buffer += '#------------------------------------\n';
  buffer += '\n';

  const maxFileLength = entries.reduce((a,[file]) => Math.max(a, file.length), 0);
  entries.forEach(([file, value]) => {
    buffer += `${padRight(file, maxFileLength)}\t${value}`;
    buffer += '\n';
  });

  buffer += '\n';
  buffer += `# Please do not add/remove lines. It is not allowed and edit will fail`;

  return buffer;
};

function applyChanges(key, entries, context) {
  for (let i = 0; i < entries.length; i++) {
    const [file, newValue] = entries[i];
    const fileName = path.resolve(path.join(context.path, file));
    const content = JSON.parse(fs.readFileSync(fileName));
    content[key] = newValue;
    fs.writeFileSync(fileName, JSON.stringify(content, null, context.indentation));
  }
}
function parseEditBufferLine(line) {
  let separatorIdx = line.indexOf('\t');
  // if (separatorIdx === -1) separatorIdx = line.indexOf('\t');
  if (separatorIdx === -1) {
    console.log(`failed to parse a line\n${line}`);
    process.exit(1);
  }
  const fileName = line.substr(0, separatorIdx).trim();
  const value = line.substr(separatorIdx + 1).trim();
  return [fileName, value];
}
const getKeyOrDefault = (json, key, defaultValue = '.') => json.hasOwnProperty(key) ? json[key] : defaultValue;

/**
 * Write the file content to the file, then open the file in the editor for user to edit.
 * @param editor
 * @param tmpFileName
 * @param fileContent
 * @returns {Promise}
 */
function spawnEditor(editor, tmpFileName, fileContent) {
  return new Promise((resolve, reject) => {
    fs.writeFile(tmpFileName, fileContent, err => {
      if (err) {
        return reject(err);
      }

      const editorProc = childProcess.spawn(editor, [tmpFileName], { stdio: 'inherit' });
      editorProc.on('close', code => {
        if (code === 0) resolve();
        else reject({ code });
      });
      editorProc.on('error', reject);
    });
  });
}

async function fileLines(file) {
  let p;
  let resolve;
  let reject;
  const lines = [];
  p = new Promise((rs, rj) => (resolve = rs, reject = rj));

  const rl = readline.createInterface({
    input: fs.createReadStream(file)
  });

  rl.on('line', line => lines.push(line));
  rl.on('close', () => resolve(lines));

  return p;
}

function trimAndStripComments(rawFileLine) {
  let line = rawFileLine && rawFileLine.trim();
  if (line && line.startsWith('#')) line = '';
  return line;
}

async function locliCopy(key, newKey, options) {
  const localesPath = options.path;
  const indentation = options.indentation;

  const vocabularies = loadVocabularies(localesPath);
  const copyEntries = vocabularies.map(({ file, data }) => [file, getKeyOrDefault(data, key)]);
  const editBuffer = createBuffer(key, newKey, copyEntries);
  const editFile = './\~locli.copy';

  try {
    await spawnEditor(EDITOR, editFile, editBuffer);

    const lines = await fileLines(editFile);
    const editedEntries = lines.filter(trimAndStripComments).map(parseEditBufferLine);

    if (vocabularies.length !== editedEntries.length) {
      console.log('Error');
      console.log('altering number of lines is not allowed');
      console.log(`${vocabularies.length} are being edited, but ${editedEntries.length} are submitted`);
      process.exit(1);
    }

    applyChanges(newKey, editedEntries, options);
  } catch(e) {
    // throws if exitCode !== 0 or other errors
    console.log('error while editing...');
  }

  // const editFile = './\~locli.copy';
  // fs.writeFileSync(editFile, editBuffer);
  // const editor = childProcess.spawn(EDITOR, [editFile], {stdio: 'inherit'});
  // editor.on('close', code => {
  //   // TODO: may check edit buffer md5, and if it is the same - do not apply changes
  //   // console.log(`${EDITOR} exit code is`, code);
  //   if (code === 0) {
  //     handleEditComplete();
  //   } else {
  //     console.log('editor process exit with error.. aborting edit');
  //   }
  //
  // });
  // editor.on('error', (...args) => console.log('Editor process error', args));
  // editor.on('data', (...args) => console.log('Editor process data', args));

  // function handleEditComplete() {
  //   const editedEntries = [];
  //
  //   const rl = readline.createInterface({
  //     input: fs.createReadStream(editFile)
  //   });
  //
  //   // Read edited info
  //   rl.on('line', line => {
  //     const trimmed = line && line.trim();
  //     if (!trimmed || trimmed.startsWith('#')) return;
  //     editedEntries.push(parseEditBufferLine(line));
  //   });
  //
  //   rl.on('close', () => {
  //     if (vocabularies.length !== editedEntries.length) {
  //       console.log('Error');
  //       console.log('altering number of lines is not allowed');
  //       console.log(`${vocabularies.length} are being edited, but ${editedEntries.length} are submitted`);
  //       process.exit(1);
  //     }
  //
  //     applyChanges(newKey, editedEntries, options);
  //   });
  // }
};

module.exports = locliCopy;
