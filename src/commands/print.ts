import {
  loadFiles,
} from '../utils';
import padEnd = require('lodash/padEnd');

async function print(keys: string[], options: any) {
  const files = await loadFiles(options);

  for (const key of keys) {
    const values = files.map(({fileName, data}) => [fileName, data[key]]);
    const maxFileNameLength = values.reduce((a, [b]) => Math.max(a, b.length), 0);
    console.log('----------');
    console.log(`Key ${key}`);
    console.log('----------');
    values.map(([fileName, value]) => {
      console.log(`${padEnd(fileName, maxFileNameLength)}\t${value}`);
    });
  }
}

export default print;
