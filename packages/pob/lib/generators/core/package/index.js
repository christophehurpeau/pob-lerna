'use strict';

const fs = require('fs');
const path = require('path');
const askName = require('inquirer-npm-name');
const Generator = require('yeoman-generator');
const inLerna = require('../../../utils/inLerna');
const packageUtils = require('../../../utils/package');

module.exports = class PackageGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('private', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'private package',
    });
  }

  async initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

    if (!pkg.engines) pkg.engines = {};

    // dont override engines if set to latest
    if (!pkg.engines.node || !pkg.engines.node.startsWith('>=14.')) {
      // this might be overridden by babel generator
      pkg.engines.node = '>=12.10.0';
    }

    if (!this.options.updateOnly) {
      if (this.options.private || (inLerna && inLerna.root)) {
        pkg.private = true;
      } else {
        const { isPrivate } = await this.prompt({
          type: 'confirm',
          name: 'isPrivate',
          message: 'Private package ?',
          default: pkg.private === true,
        });
        if (isPrivate) {
          pkg.private = isPrivate;
        } else {
          delete pkg.private;
        }
      }
    }

    if (inLerna && inLerna.root) {
      if (!pkg.name) {
        const { name } = await this.prompt({
          name: 'name',
          message: 'Monorepo Name',
          default: path.basename(process.cwd()),
          validate: (str) => str.length > 0,
        });
        pkg.name = name;
      } else if (pkg.name.endsWith('-lerna')) {
        pkg.name = pkg.name.replace('-lerna', '-monorepo');
      }
    } else if (!pkg.name) {
      const prompt = {
        name: 'name',
        message: 'Module Name',
        default: path.basename(process.cwd()),
        validate: (str) => str.length > 0,
      };

      const { name } = await (pkg.private
        ? this.prompt([prompt])
        : askName(prompt, this));
      pkg.name = name;
    }

    let author = packageUtils.parsePkgAuthor(pkg);

    const props = await this.prompt(
      [
        !this.options.updateOnly &&
          !(inLerna && inLerna.root) && {
            name: 'description',
            message: 'Description',
            default: pkg.description,
          },
        {
          name: 'authorName',
          message: "Author's Name",
          when: !author || !author.name,
          default: this.user.git.name(),
        },
        {
          name: 'authorEmail',
          message: "Author's Email",
          when: !author || !author.email,
          default: this.user.git.email(),
        },
        {
          name: 'authorUrl',
          message: "Author's Homepage",
          when: !author || !author.url,
        },
      ].filter(Boolean),
    );

    pkg.description = this.options.updateOnly
      ? pkg.description
      : props.description || pkg.description;

    if (inLerna && !inLerna.root) {
      const rootMonorepoPkg = inLerna.rootMonorepoPkg;
      const rootRepositoryUrl =
        typeof rootMonorepoPkg.repository === 'string'
          ? rootMonorepoPkg.repository
          : rootMonorepoPkg.repository.url;
      pkg.repository = {
        type: 'git',
        url: rootRepositoryUrl,
        directory: process.cwd().slice(inLerna.rootPath.length + 1),
      };
      pkg.homepage = rootMonorepoPkg.homepage;

      if (this.fs.exists(this.destinationPath('yarn.lock'))) {
        fs.unlinkSync(this.destinationPath('yarn.lock'));
      }
    }
    if (this.fs.exists(this.destinationPath('yarn-error.log'))) {
      fs.unlinkSync(this.destinationPath('yarn-error.log'));
    }

    if (inLerna && !inLerna.root) {
      packageUtils.removeScripts(pkg, ['checks']);
    } else if (inLerna && inLerna.root) {
      packageUtils.addOrRemoveScripts(
        pkg,
        this.fs.exists(this.destinationPath('scripts/check-packages.js')),
        {
          checks: 'node scripts/check-packages.js',
        },
      );
    } else {
      packageUtils.addOrRemoveScripts(
        pkg,
        this.fs.exists(this.destinationPath('scripts/check-package.js')),
        {
          checks: 'node scripts/check-package.js',
        },
      );
    }

    author = {
      name: props.authorName || author.name,
      email: props.authorEmail || author.email,
      url: props.authorUrl || (author && author.url),
    };

    pkg.author = `${author.name} <${author.email}>${
      author.url ? ` (${author.url})` : ''
    }`;

    if (pkg.private) {
      if (!pkg.description) delete pkg.description;
      if (!pkg.keywords || pkg.keywords.length === 0) delete pkg.keywords;
    } else if (!pkg.keywords) {
      pkg.keywords = [];
    }

    if (!pkg.private && !pkg.version) {
      // lerna root pkg should not have version
      pkg.version = '0.0.0';
    }

    if (!pkg.private && !pkg.publishConfig && pkg.name[0] === '@') {
      pkg.publishConfig = {
        access: 'public',
      };
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }
};
