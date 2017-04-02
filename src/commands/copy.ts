import padEnd = require('lodash/padEnd');
import keyBy = require('lodash/keyBy');
import {
  loadFiles,
  writeFile,
  propOrDefault,
  spawnEditor,
  parseSkipComments,
  parseBufferLine,
  fileLines,
} from '../utils';

function createBuffer(srcKey: string, dstKey: string, entries: Array<[string, string]>) {
  let buffer = '';
  buffer += `# You copy "${srcKey}" to new key "${dstKey}"\n`;
  buffer += '# Empty line, or lines starting with "#" will be skipped\n';
  buffer += '#------------------------------------\n';
  buffer += '\n';

  const maxFileLength = entries.reduce((a, [file]) => Math.max(a, file.length), 0);
  entries.forEach(([file, value]) => {
    buffer += `${padEnd(file, maxFileLength)}\t${value}`;
    buffer += '\n';
  });

  buffer += '\n';
  buffer += `# Please do not add/remove lines. It is not allowed and edit will fail`;

  return buffer;
}

async function copy(srcKey: string, dstKey: string, options: any) {
  const files = await loadFiles(options);
  const editBuffer = createBuffer(
    srcKey, dstKey, files.map(({ fileName, data }): [string, string] => [fileName, propOrDefault(data, srcKey)]),
  );
  const editFile = './\~locli.copy';

  await spawnEditor(options.editor, editFile, editBuffer);
  const editedEntries = (await fileLines(editFile)).filter(parseSkipComments).map(parseBufferLine);

  if (files.length !== editedEntries.length) {
    console.log('Error');
    console.log('altering number of lines is not allowed');
    console.log(`${files.length} are being edited, but ${editedEntries.length} are submitted`);
    process.exit(1);
  }

  const byFileName = keyBy(files, 'fileName');
  for (const [fileName, value] of editedEntries) {
    const file = byFileName[fileName];
    file.data[dstKey] = value;
    await writeFile(file, options);
  }
}

export default copy;
