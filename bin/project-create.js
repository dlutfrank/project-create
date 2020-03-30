#!/usr/bin/env node
const Command = require('..');

new Command().run(process.cwd, process.argv.slice(2))
  .then(res => {
    console.info(`success: ${JSON.stringify(res)}`);
  }).catch(err => {
    console.error(err.stack);
    process.exit(-1);
  });
