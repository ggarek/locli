import {
  loadFiles,
  writeFile,
} from '../utils';

async function remove(keys:string[], options:any):Promise<void> {
  const files = await loadFiles(options);

  for (const key of keys) {
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
    console.log(`Removing key "${key}"\t${hit}/${files.length} removed.`);
    if (hit < files.length) {
      console.log(`These files do not have "${key}" key: ${missed.map(x => x.fileName).join(', ')}`);
      console.log('Please check files integrity');
    }
  }
}

export default remove;
