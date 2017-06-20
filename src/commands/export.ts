import {
  loadFiles,
} from '../utils';
import _fs = require('fs');
import pify = require('pify');
const fs = pify(_fs);

const CSV_SEPARATOR = ',';
const escapeCSVString = (str: string) => {
  if (str.indexOf(CSV_SEPARATOR) > -1) {
    return `"${str.replace('"', '""')}"`;
  }
  return str;
};

async function exportData(keys: string[], context: any, options: any) {
  if (options.format !== 'csv') {
    console.log('export is currently possible only in CSV format');
    process.exit(1);
  }

  const files = await loadFiles(context);

  let finalKeys = keys;
  if (keys.length === 1 && keys[0] === '*') {
    const ethalon = files.find(x => x.fileName === context.ethalon);
    if (!ethalon) {
      console.log('ethalon "%s" not found, can not export all keys', context.ethalon);
      process.exit(1);
    }
    finalKeys = Object.keys(ethalon.data);
  }

  const finalFiles = files.filter(x => options.lang === '*' || options.lang.indexOf(x.fileName.split('.')[0]) > -1);

  const rows = [
    ['key', ...finalFiles.map(x => x.fileName.split('.')[0])],
    ...finalKeys.map((key, i) => [key, ...finalFiles.map(x => escapeCSVString(x.data[key]))]),
  ];

  await fs.writeFile(options.outFile, rows.map(row => row.join(CSV_SEPARATOR)).join('\n'));
}

export default exportData;
