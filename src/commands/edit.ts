import {
  loadVocabularies,
  spawnEditor,
  fileLines,
  parseSkipComments,
  parseBufferLine,
} from '../utils';
import padEnd = require('lodash/padEnd');
import path = require('path');
import pify = require('pify');
import _fs = require('fs');
const fs = pify(_fs);

function createEditBuffer(key: string, entries: Array<[string, string]>) {
  let buffer = '';
  buffer += `# You are about to edit a key "${key}"\n`;
  buffer += '# Empty line, or lines starting with "#" will be skipped\n';
  buffer += '#------------------------------------\n';
  buffer += '\n';

  const maxFileLength = entries.reduce((a,[b]) => Math.max(a, b.length), 0);
  entries.forEach(([file, value]) => {
    buffer += `${padEnd(file, maxFileLength)}\t${value}`;
    buffer += '\n';
  });

  buffer += '\n';
  buffer += `# Please do not add/remove lines. It is not allowed and edit will fail`;

  return buffer;
}

async function applyChanges(key:string, entries:[string, string][], context:any) {
for (let i = 0; i < entries.length; i++) {
    const [file, newValue] = entries[i];
    const fileName = path.resolve(path.join(context.path, file));
    const content = JSON.parse(await fs.readFile(fileName, 'utf8'));
    content[key] = newValue;
    await fs.writeFile(fileName, JSON.stringify(content, null, context.indentation));
  }
}

const propOrDefault = (src: { [key: string]: any }, key: string, defaultValue:any = '.'):string => {
  return src && src.hasOwnProperty(key) ? String(src[key]) : defaultValue;
};

async function edit(key: string, options: any): Promise<void> {
  const localesPath = options.path;
  const vocabularies = loadVocabularies(localesPath);
  const editEntries = vocabularies.map(({ file, data }):[string, string] => [file, propOrDefault(data, key)]);
  const editBuffer = createEditBuffer(key, editEntries);
  const editFile =  './\~locli.edit';

  try {
    await spawnEditor(options.editor, editFile, editBuffer);

    const lines = await fileLines(editFile);
    const editedEntries = lines.filter(parseSkipComments).map(parseBufferLine);

    if (vocabularies.length !== editedEntries.length) {
      console.log('Error');
      console.log('altering number of lines is not allowed');
      console.log(`${vocabularies.length} are being edited, but ${editedEntries.length} are submitted`);
      process.exit(1);
    }

    await applyChanges(key, editedEntries, options);
  } catch(e) {
    // throws if exitCode !== 0 or other errors
    console.log('error while editing...');
  }
}

export default edit;