import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import readline = require('readline');


function loadVocabularies(dirPath: string) {
  const files = fs.readdirSync(dirPath);

  const entries = [];
  for (let i = 0; i < files.length; i++) {
    const fileName = path.resolve(path.join(dirPath, files[i]));
    const data = JSON.parse(fs.readFileSync(fileName, 'utf8'));

    entries.push({
      file: files[i],
      path: fileName,
      data,
    });
  }

  return entries;
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
        if (code === 0) resolve();
        else reject({ code });
      });
      editorProc.on('error', reject);
    });
  });
}

async function fileLines(file: string): Promise<string[]> {
  let p:Promise<string[]>;
  let resolve: (result: any) => void;
  let reject;
  const lines: string[] = [];
  p = new Promise((rs, rj) => (resolve = rs, reject = rj));

  const rl = readline.createInterface({
    input: fs.createReadStream(file)
  });

  rl.on('line', line => lines.push(line));
  rl.on('close', () => resolve(lines));

  return p;
}


function parseSkipComments(rawFileLine: string) {
  let line = rawFileLine && rawFileLine.trim();
  if (line && line.startsWith('#')) line = '';
  return line;
}

function parseBufferLine(line: string):[string, string] {
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

export {
  loadVocabularies,
  spawnEditor,
  fileLines,
  parseSkipComments,
  parseBufferLine,
}
