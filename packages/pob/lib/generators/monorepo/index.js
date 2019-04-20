'use strict';

const { readdirSync, existsSync } = require('fs');
const Generator = require('yeoman-generator');

module.exports = class PobMonorepoGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });
  }

  initializing() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const packagesPath = pkg.workspaces
      ? pkg.workspaces[0].replace(/\/\*$/, '')
      : 'packages';
    this.packageNames = existsSync(`${packagesPath}/`)
      ? readdirSync(`${packagesPath}/`).filter((packageName) =>
          existsSync(`${packagesPath}/${packageName}/package.json`)
        )
      : [];
  }

  async prompting() {
    const config = this.config.get('monorepo');
    if (this.options.updateOnly && config) {
      this.pobLernaConfig = config;
      this.pobLernaConfig.packageNames = this.packageNames;
      this.config.set('monorepo', this.pobLernaConfig);
      return;
    }

    this.pobLernaConfig = await this.prompt([
      {
        type: 'confirm',
        name: 'ci',
        message: 'Would you like ci ?',
        default: config
          ? config.ci
          : this.fs.exists(this.destinationPath('.circleci/config.yml')),
      },
      {
        type: 'confirm',
        name: 'testing',
        message: 'Would you like testing ?',
        when: (answers) => answers.ci,
        default: config ? config.testing : true,
      },
      {
        type: 'confirm',
        name: 'codecov',
        message: 'Would you like code coverage ?',
        when: (answers) => answers.ci && answers.testing,
        default: config ? config.codecov : true,
      },
      {
        type: 'confirm',
        name: 'documentation',
        message: 'Would you like documentation ?',
        when: (answers) => answers.ci,
        default: config ? config.documentation : true,
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Would you like typescript monorepo ?',
        default: config ? config.typescript : true,
      },
    ]);
    this.pobLernaConfig.packageNames = this.packageNames;
    this.config.set('monorepo', this.pobLernaConfig);
    this.config.delete('pob-config');
  }

  default() {
    this.composeWith(require.resolve('../core/ci'), {
      enable: this.pobLernaConfig.ci,
      testing: this.pobLernaConfig.testing,
      codecov: this.pobLernaConfig.codecov,
      documentation: this.pobLernaConfig.documentation,
      updateOnly: this.options.updateOnly,
    });

    // Always add a gitignore, because npm publish uses it.
    this.composeWith(require.resolve('../core/gitignore'), {
      root: true,
      typescript: this.pobLernaConfig.typescript,
    });

    this.composeWith(require.resolve('./typescript'), {
      enable: this.pobLernaConfig.typescript,
      packageNames: JSON.stringify(this.packageNames),
    });
  }

  end() {
    console.log('save config');
    this.config.save();
  }
};
