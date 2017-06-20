#!/usr/bin/env node
import * as fs from 'fs';
import * as program from 'commander';
import path = require('path');
import editCmd from './commands/edit';
import removeCmd from './commands/remove';
import renameCmd from './commands/rename';
import copyCmd from './commands/copy';
import printCmd from './commands/print';
import exportCmd from './commands/export';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// TODO: it is local context, the information necessary for each command
const context = {
  path: './src/vocabularies', // path to files to be processed
  indentation: '  ',
  editor: 'vim',
  ethalon: 'en.json',
};

const list = (str: string) => str.split(',');

program.version(pkg.version);

/* Define commands */
program.command('edit <key>')
  .description('edit values for the key')
  .action((key: string, options: any) => editCmd(key, {...context, ...options}));

program.command('remove <keys>')
  .description('remove the key')
  .action((keys: string, options: any) => removeCmd(list(keys), {...context, ...options}));

program.command('rename <oldKey> <newKey>')
  .description('rename the key')
  .action((oldKey: string, newKey: string, options: any) => renameCmd(oldKey, newKey, {...context, ...options}));

program.command('copy <srcKey> <dstKey>')
  .description('make a copy of an existing key')
  .action((srcKey: string, dstKey: string, options: any) => copyCmd(srcKey, dstKey, {...context, ...options}));

program.command('print <keys>')
  .description('print values for the key')
  .action((keys, options) => printCmd(list(keys), {...context, ...options}));

program.command('export <keys>')
  .option('--format <format>', 'Export format', /^(csv)$/i)
  .option('-o, --outFile <file>', 'Output file')
  .option('--lang <lang>', 'Languages to export', list, '*')
  .description('export data')
  .action((keys, options) => exportCmd(list(keys), context, options));

program.parse(process.argv);
