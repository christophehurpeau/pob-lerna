'use strict';

const { readFileSync } = require('fs');
const inLerna = require('./inLerna');

module.exports =
  inLerna &&
  JSON.parse(readFileSync(inLerna.lernaJsonPath)).npmClient !== 'yarn';
