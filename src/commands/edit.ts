import {
  spawnEditor,
  fileLines,
  parseSkipComments,
  parseBufferLine,
  propOrDefault,
  loadFiles,
  writeFile,
} from '../utils';
import padEnd = require('lodash/padEnd');
import keyBy = require('lodash/keyBy');
import path = require('path');

function createBuffer(key: string, entries: Array<[string, string]>) {
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

async function edit(key: string, options: any): Promise<void> {
  const files = await loadFiles(options);
  const editBuffer = createBuffer(
    key, files.map(({ fileName, data }):[string, string] => [fileName, propOrDefault(data, key)])
  );
  const editFile =  './\~locli.edit';

  await spawnEditor(options.editor, editFile, editBuffer);

  const lines = await fileLines(editFile);
  const editedEntries = lines.filter(parseSkipComments).map(parseBufferLine);

  if (files.length !== editedEntries.length) {
    console.log('Error');
    console.log('altering number of lines is not allowed');
    console.log(`${files.length} are being edited, but ${editedEntries.length} are submitted`);
    process.exit(1);
  }

  const byFileName = keyBy(files, 'fileName');
  for (const [fileName, value] of editedEntries) {
    const file = byFileName[fileName];
    file.data[key] = value;
    await writeFile(file, options);
  }
}

export default edit;