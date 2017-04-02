import {
  loadFiles,
  writeFile,
} from '../utils';

async function rename(oldKey: string, newKey: string, options: any): Promise<void> {
  const missed = [];
  const files = await loadFiles(options);
  for (const file of files) {
    if (file.data.hasOwnProperty(oldKey)) {
      const value = file.data[oldKey];
      delete file.data[oldKey];
      file.data[newKey] = value;
      await writeFile(file, options);
    } else {
      missed.push(file);
    }
  }

  const hit = files.length - missed.length;
  console.log(`${hit} of ${files.length} entries renamed`);
  if (hit !== files.length) {
    console.log(`These files do not have ${oldKey} key: ${missed.map(x => x.fileName).join(', ')}`);
    console.log('Please check files integrity');
  }
}

export default rename;
