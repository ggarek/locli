import {
  loadFiles,
} from '../utils';
import padEnd = require('lodash/padEnd');

async function print(key:string, options:any){
  const files = await loadFiles(options);

  const values = files.map(({ fileName, data }) => [fileName, data[key]]);
  const maxFileNameLength = values.reduce((a, [b]) => Math.max(a, b.length), 0);
  console.log('----------');
  console.log(`Key ${key}`);
  console.log('----------');
  values.map(([fileName, value]) => {
    console.log(`${padEnd(fileName, maxFileNameLength)}\t${value}`);
  });
}

export default print;
