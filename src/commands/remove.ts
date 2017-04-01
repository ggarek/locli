import {
  loadFiles,
  writeFile,
} from '../utils';

async function remove(key:string, options:any):Promise<void> {
  const files = await loadFiles(options);

  const missed = [];
  for (const file of files) {
    if (file.data.hasOwnProperty(key)) {
      delete file.data[key];
      await writeFile(file, options);
    } else {
      missed.push(file);
    }
  }

  const hit = files.length - missed.length;
  console.log(`${hit} of ${files.length} keys removed.`);
  if (hit < files.length) {
    console.log(`These files do not have ${key} key: ${missed.map(x => x.fileName).join(', ')}`);
    console.log('Please check files integrity');
  }
}

export default remove;
