#!/usr/bin/env node

// commander, this is main things
const program = require('commander');

// prompt
// so we have menu
const Prompts = require('../lib/prompts');

global.Prompts = Prompts;


// program which is the commander to get cmmd input
program
  // print usage
  .usage('just use it')
  // tell me what is that
  .description('wapplyzer cli')
  // parse argv
  .parse(process.argv);

// new line
console.log();

// don't forget to popup the menu
Prompts.menu();
