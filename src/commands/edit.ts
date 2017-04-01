import {
  loadVocabularies,
  spawnEditor,
  fileLines,
  parseSkipComments,
  parseBufferLine, ILoadedFile,
} from '../utils';
import { IHash } from '../types';
import padEnd = require('lodash/padEnd');
import keyBy = require('lodash/keyBy');
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

async function applyChanges(key:string, vocabularies:Array<ILoadedFile>, entries:[string, string][], context:any) {
  const byFile:IHash<ILoadedFile> = keyBy(vocabularies, 'fileName');
  return Promise.all(entries.map(([file, newValue]) => {
    const { data, filePath } = byFile[file];
    data[key] = newValue;
    return fs.writeFile(filePath, JSON.stringify(data, null, context.indentation));
  }));
}

const propOrDefault = (src: { [key: string]: any }, key: string, defaultValue:any = '.'):string => {
  return src && src.hasOwnProperty(key) ? String(src[key]) : defaultValue;
};

async function edit(key: string, options: any): Promise<void> {
  const localesPath = options.path;
  const vocabularies = loadVocabularies(localesPath);
  const editEntries = vocabularies.map(({ fileName, data }):[string, string] => [fileName, propOrDefault(data, key)]);
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

    await applyChanges(key, vocabularies, editedEntries, options);
  } catch(e) {
    // throws if exitCode !== 0 or other errors
    console.log('error while editing...');
  }
}

export default edit;