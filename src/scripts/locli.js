#!/usr/bin/env node --harmony

'use strict';

const fs = require('fs');
const program = require('commander');

const pkg = JSON.parse(fs.readFileSync('./package.json'));

// TODO: it is local context, the information necessary for each command
const context = {
  path: './src/vocabularies', // path to files to be processed
  indentation: ' ',
};

program.version(pkg.version);

program.command('add [key]')
  .description( 'add a new key')
  .option('-i --interactive', 'interactive mode')
  .action((key, options) => {
    if (options.interactive) {
      console.log('adding key interactively', key);
      require('./locli-add')(key, {...context, ...options});
      // locliAddInteractive({...context});
    } else {
      console.log('locli supports only interactive mode (-i) for now');
      process.exit(1);
    }
  });
  // .command('remove', 'remove a key')
  // .command('rename', 'rename a key')
  // .command('print', 'print report by a given key')
  // .command('verify', 'verify files by a given ethalon')

program.parse(process.argv);