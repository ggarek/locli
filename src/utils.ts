import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import readline = require('readline');

import pify = require('pify');
const pfs = pify(fs);

export interface ILoadedFile {
  fileName: string;
  filePath: string;
  data: { [key: string]: any };
}

/**
 * Write the file content to the file, then open the file in the editor for user to edit.
 */
function spawnEditor(editor: string, tmpFileName: string, fileContent: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(tmpFileName, fileContent, err => {
      if (err) {
        return reject(err);
      }

      const editorProc = childProcess.spawn(editor, [tmpFileName], { stdio: 'inherit' });
      editorProc.on('close', code => {
        // TODO :q in Vim results in exit code 0, which is good..
        // but i want to treat exit without save as abort.. how do i do that?
        if (code === 0) {
          resolve();
        } else {
          reject({ code });
        }
      });
      editorProc.on('error', reject);
    });
  });
}

async function fileLines(file: string): Promise<string[]> {
  let p: Promise<string[]>;
  let resolve: (result: any) => void;
  let reject;
  const lines: string[] = [];
  p = new Promise((rs, rj) => (resolve = rs, reject = rj));

  const rl = readline.createInterface({
    input: fs.createReadStream(file),
  });

  rl.on('line', line => lines.push(line));
  rl.on('close', () => resolve(lines));

  return p;
}

function parseSkipComments(rawFileLine: string) {
  let line = rawFileLine && rawFileLine.trim();
  if (line && line.startsWith('#')) {
    line = '';
  }
  return line;
}

function parseBufferLine(line: string): [string, string] {
  const separatorIdx = line.indexOf('\t');
  // if (separatorIdx === -1) separatorIdx = line.indexOf('\t');
  if (separatorIdx === -1) {
    console.log(`failed to parse a line\n${line}`);
    process.exit(1);
  }
  const fileName = line.substr(0, separatorIdx).trim();
  const value = line.substr(separatorIdx + 1).trim();
  return [fileName, value];
}

async function loadFiles(context: any): Promise<ILoadedFile[]> {
  const files: Array<Promise<ILoadedFile>> =
    (await pfs.readdir(context.path))
      .map((fileName: string) => [fileName, path.resolve(path.join(context.path, fileName))])
      .map(([fileName, filePath]: [string, string]) =>
        pfs.readFile(filePath, 'utf8')
          .then((content: string) => ({ fileName, filePath, data: JSON.parse(content) })),
      );
  return Promise.all(files);
}

async function writeFile(file: ILoadedFile, context: any): Promise<void> {
  return pfs.writeFile(file.filePath, JSON.stringify(file.data, null, context.indentation));
}

const propOrDefault = (src: { [key: string]: any }, key: string, defaultValue: any = '.'): string => {
  return src && src.hasOwnProperty(key) ? String(src[key]) : defaultValue;
};

export {
  spawnEditor,
  fileLines,
  parseSkipComments,
  parseBufferLine,
  loadFiles,
  writeFile,
  propOrDefault,
};
