'use strict';

const fs = require('fs');
const prettier = require('prettier');

const ensureJsonFileFormatted = (path) => {
  try {
    const pkgJson = fs.readFileSync(path, 'utf-8');
    const formattedPkg = prettier.format(pkgJson, {
      filepath: path,
    });
    if (pkgJson !== formattedPkg) {
      console.warn(`formatted json file ${path}`);
      fs.writeFileSync(path, formattedPkg);
    }
  } catch {}
};

module.exports = ensureJsonFileFormatted;
