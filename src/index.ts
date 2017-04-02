import * as fs from 'fs';
import * as program from 'commander';
import editCmd from './commands/edit';
import removeCmd from './commands/remove';
import renameCmd from './commands/rename';
import copyCmd from './commands/copy';
import printCmd from './commands/print';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// TODO: it is local context, the information necessary for each command
const context = {
  path: './src/vocabularies', // path to files to be processed
  indentation: '  ',
  editor: 'vim',
};

const list = (str:string) => str.split(',');

program.version(pkg.version);

/* Define commands */
program.command('edit <key>')
  .description('edit values for the key')
  .action((key: string, options: any) => editCmd(key, {...context, ...options}));

program.command('remove <key>')
  .description('remove the key')
  .action((key:string, options:any) => removeCmd(key, {...context, ...options}));

program.command('rename <oldKey> <newKey>')
  .description('rename the key')
  .action((oldKey:string, newKey:string, options:any) => renameCmd(oldKey, newKey, {...context, ...options}));

program.command('copy <srcKey> <dstKey>')
  .description('make a copy of an existing key')
  .action((srcKey:string, dstKey:string, options:any) => copyCmd(srcKey, dstKey, {...context, ...options}));

program.command('print <keys>')
  .description('print values for the key')
  .action((keys, options) => printCmd(list(keys), {...context, ...options}));

program.parse(process.argv);