import * as fs from 'fs';
import * as program from 'commander';
import editCommand from './commands/edit';
import removeCommand from './commands/remove';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// TODO: it is local context, the information necessary for each command
const context = {
  path: './src/vocabularies', // path to files to be processed
  indentation: '  ',
  editor: 'vim',
};

program.version(pkg.version);

/* Define commands */
program.command('edit [key]')
  .description('edit values for the key')
  .action((key: string, options: any) => editCommand(key, {...context, ...options}));

program.command('remove [key]')
  .description('remove the key')
  .action((key:string, options:any) => removeCommand(key, {...context, ...options}));


program.parse(process.argv);