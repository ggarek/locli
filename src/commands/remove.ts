import _fs = require('fs');
import path = require('path');
import pify = require('pify');
const fs = pify(_fs);

async function remove(key:string, options:any):Promise<void> {
  const files:[string, string][] = (await fs.readdir(options.path))
    .map((file:string) => [file, path.resolve(path.join(options.path, file))]);

  const doNotHaveKey = [];
  for (const [fileName, filePath] of files) {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    if (data.hasOwnProperty(key)) {
      delete data[key];
      await fs.writeFile(filePath, JSON.stringify(data, null, options.indentation));
    } else {
      doNotHaveKey.push(fileName);
    }
  }

  console.log(`${files.length - doNotHaveKey.length} of ${files.length} keys removed.`);
  console.log(`These files do not have ${key} key: ${doNotHaveKey.join(', ')}`);
  console.log('Please check files integrity');
}

export default remove;
