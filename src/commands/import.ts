import pify = require('pify');
import path = require('path');
import _fs = require('fs');
const fs = pify(_fs);
import { fileLines, writeFile } from '../utils';

function localesFromCSV(lines: string[], opts: any) {
  const separator = opts.separator;
  const headers = lines[0].split(separator).filter(Boolean);

  // Create objects for imported locales
  const locales: any[] = headers.slice(1).map(lang => ({ lang, data: {} }));

  lines.slice(1)
    .sort((a: string, b: string) => a > b ? 1 : a < b ? -1 : 0)
    .forEach(line => {
      const [key, ...langs] = line.split(separator).filter(Boolean);
      locales.forEach((locale, i) => locale.data[key] = langs[i]);
    });

  return locales;
}

async function importData(file: string, context: any, options: any) {
  if (options.format !== 'csv') {
    console.log('import is currently possible only in CSV format');
    process.exit(1);
  }

  const data = await fileLines(file);
  const locales = localesFromCSV(data, options);

  if (locales.length === 0) {
    console.log('No data found to import or parsing failed (e.g. wrong separator for CSV file were given)');
    return;
  }

  await Promise.all(locales.map(({ lang, data }) => {
      const file = {
        fileName: `${lang}.json`,
        filePath: path.join(context.path, `${lang}.json`),
        data: data,
      };

      if (!options.overwrite && fs.existsSync(file.filePath)) {
        console.log(`File ${file.fileName} already exists (run with --overwrite to overwrite the file)`);
        return null;
      }

      return writeFile(file, context);
    })
  );
}

export default importData;
