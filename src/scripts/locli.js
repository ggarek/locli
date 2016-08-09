#!/usr/bin/env node --harmony

const fs = require('fs');
const program = require('commander');
const locliAdd = require('./locli-add');
const locliRemove = require('./locli-remove');
const locliRename = require('./locli-rename');
const locliPrint = require('./locli-print');

const pkg = JSON.parse(fs.readFileSync('./package.json'));

// TODO: it is local context, the information necessary for each command
const context = {
  path: './src/vocabularies', // path to files to be processed
  indentation: '  ',
};

program.version(pkg.version);

program.command('add [key]')
  .description( 'add the new key')
  .option('-i --interactive', 'interactive mode')
  .action((key, options) => locliAdd(key, {...context, ...options}));

program.command('remove [key]')
  .description('remove the key')
  .action((key, options) => locliRemove(key, {...context, ...options}));

program.command('rename [oldKey] [newKey]')
  .description('rename oldKey to newKey')
  .action((oldKey, newKey, options) => locliRename(oldKey, newKey, {...context, ...options}));

program.command('print [key]')
  .description('print values for the key')
  .action((key, options) => locliPrint(key, {...context, ...options}));
  
// .command('verify', 'verify files by a given ethalon')

program.parse(process.argv);