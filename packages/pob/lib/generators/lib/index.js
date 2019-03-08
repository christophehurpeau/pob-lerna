'use strict';

const { execSync } = require('child_process');
const Generator = require('yeoman-generator');
const mkdirp = require('mkdirp');
const packageUtils = require('../../utils/package');
const inLerna = require('../../utils/inLerna');
const inNpmLerna = require('../../utils/inNpmLerna');

module.exports = class PobLibGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('updateOnly', {
      type: Boolean,
      required: false,
      defaults: false,
      desc: 'Avoid asking questions',
    });

    this.option('fromPob', {
      type: Boolean,
      required: false,
      defaults: false,
    });
  }

  initializing() {
    this.pobjson = this.config.get('pob') || this.config.get('pob-config');
    if (!this.pobjson) {
      this.pobjson = this.fs.readJSON(this.destinationPath('.pob.json'), null);
      if (this.pobjson) {
        this.config.set('pob-config', this.pobjson);
        this.config.save();
      }
    }

    this.config.delete('pob'); // deprecated
    this.fs.delete('.pob.json'); // deprecated

    if (!this.pobjson) {
      this.pobjson = {};
      this.updateOnly = false;
    } else {
      this.updateOnly = this.options.updateOnly;
    }
    if (!this.pobjson.entries) this.pobjson.entries = ['index'];

    this.babelEnvs = this.pobjson.envs || [];

    if (this.babelEnvs && typeof this.babelEnvs[0] === 'string') {
      this.babelEnvs = this.babelEnvs.map((env) => {
        switch (env) {
          case 'es5':
            throw new Error('use olderNode instead.');

          case 'node6':
          case 'node7':
          case 'node8':
            return {
              target: 'node',
              version: 8,
              formats: ['cjs'],
            };

          case 'node10':
            return {
              target: 'node',
              version: 10,
              formats: ['cjs'],
            };

          case 'webpack-node7':
          case 'module-node7':
          case 'module-node8':
            return {
              target: 'node',
              version: 8,
              formats: ['es'],
            };

          case 'module':
          case 'webpack':
            return { target: 'browser', formats: ['es'] };

          case 'module-modern-browsers':
          case 'webpack-modern-browsers':
            return {
              target: 'browser',
              version: 'modern',
              formats: ['es'],
            };

          case 'browsers':
            return { target: 'browser', formats: ['cjs'] };

          default:
            throw new Error(`Unsupported env ${env}`);
        }
      });
    }

    this.babelEnvs = this.babelEnvs.filter(
      (env) => env.target !== 'node' || env.version >= 8
    );

    if (
      !this.babelEnvs.find(
        (env) => env.target === 'node' && String(env.version) === '10'
      ) &&
      Boolean(
        this.babelEnvs.find(
          (env) => env.target === 'node' && String(env.version) === '8'
        )
      )
    ) {
      this.babelEnvs.unshift({
        target: 'node',
        version: '10',
        formats: ['cjs', 'es'],
      });
    }

    if (this.pobjson.testing === true) {
      this.pobjson.testing = {
        circleci: true,
        codecov: true,
      };
    } else if (this.pobjson.testing) {
      delete this.pobjson.testing.travisci;
    }

    if (typeof this.pobjson.documentation === 'object') {
      this.pobjson.documentation = true;
    }

    delete this.pobjson.doclets;
    delete this.pobjson.flow;
    delete this.pobjson.react;
  }

  async prompting() {
    const {
      babelNodeVersions = [],
      babelBrowserVersions = [],
      babelFormats,
    } = this.updateOnly
      ? {
          babelTargets: [
            this.babelEnvs.find((env) => env.target === 'node') && 'node',
            this.babelEnvs.find((env) => env.target === 'browser') && 'browser',
          ].filter(Boolean),
          babelNodeVersions: [
            Boolean(
              this.babelEnvs.find(
                (env) => env.target === 'node' && String(env.version) === '10'
              )
            ) && '10',
            Boolean(
              this.babelEnvs.find(
                (env) => env.target === 'node' && String(env.version) === '8'
              )
            ) && '8',
          ].filter(Boolean),
          babelBrowserVersions: [
            Boolean(
              this.babelEnvs.find(
                (env) => env.target === 'browser' && env.version === 'modern'
              )
            ) && 'modern',
            Boolean(
              this.babelEnvs.find(
                (env) => env.target === 'browser' && env.version === undefined
              )
            ) && undefined,
          ].filter((value) => value !== false),
          babelFormats: [
            Boolean(
              this.babelEnvs.find((env) => env.formats.includes('cjs'))
            ) && 'cjs',
            Boolean(this.babelEnvs.find((env) => env.formats.includes('es'))) &&
              'es',
          ].filter(Boolean),
        }
      : await this.prompt([
          {
            type: 'checkbox',
            name: 'babelTargets',
            message:
              "Babel targets: (don't select anything if you don't want babel)",
            choices: [
              {
                name: 'Node',
                value: 'node',
                checked: Boolean(
                  this.babelEnvs.find((env) => env.target === 'node')
                ),
              },
              {
                name: 'Browser',
                value: 'browser',
                checked: Boolean(
                  this.babelEnvs.find((env) => env.target === 'browser')
                ),
              },
            ],
          },

          {
            type: 'checkbox',
            name: 'babelNodeVersions',
            message: 'Babel node versions: (https://github.com/nodejs/Release)',
            when: (answers) => answers.babelTargets.includes('node'),
            validate: (versions) => versions.length > 0,
            choices: [
              {
                name: '10 (Active LTS)',
                value: '10',
                checked: Boolean(
                  this.babelEnvs.find(
                    (env) =>
                      env.target === 'node' && String(env.version) === '10'
                  )
                ),
              },
              {
                name: '8 (Maintenance LTS)',
                value: '8',
                checked: Boolean(
                  this.babelEnvs.find(
                    (env) =>
                      env.target === 'node' && String(env.version) === '8'
                  )
                ),
              },
            ],
          },

          {
            type: 'checkbox',
            name: 'babelBrowserVersions',
            message: 'Babel browser versions',
            when: (answers) => answers.babelTargets.includes('browser'),
            validate: (versions) => versions.length > 0,
            choices: [
              {
                name: 'Modern (babel-preset-modern-browsers)',
                value: 'modern',
                checked: Boolean(
                  this.babelEnvs.find(
                    (env) =>
                      env.target === 'browser' && env.version === 'modern'
                  )
                ),
              },
              {
                name: 'Supported (@babel/preset-env)',
                value: undefined,
                checked: Boolean(
                  this.babelEnvs.find(
                    (env) =>
                      env.target === 'browser' && env.version === undefined
                  )
                ),
              },
            ],
          },

          {
            type: 'checkbox',
            name: 'babelFormats',
            message: 'Babel formats',
            when: (answers) => answers.babelTargets.length !== 0,
            validate: (babelTargets) => babelTargets.length > 0,
            choices: [
              {
                name: 'commonjs',
                value: 'cjs',
                checked: Boolean(
                  this.babelEnvs.find((env) => env.formats.includes('cjs'))
                ),
              },
              {
                name: 'ES2015 module',
                value: 'es',
                checked: Boolean(
                  this.babelEnvs.find((env) => env.formats.includes('es'))
                ),
              },
            ],
          },
        ]);

    this.babelEnvs = [
      ...babelNodeVersions.map((version) => ({
        target: 'node',
        version,
        // eslint-disable-next-line no-nested-ternary
        formats: babelFormats.includes('es')
          ? version === '10'
            ? babelFormats
            : ['cjs']
          : babelFormats,
      })),
      ...babelBrowserVersions.map((version) => ({
        target: 'browser',
        version,
        // eslint-disable-next-line no-nested-ternary
        formats: babelFormats.includes('cjs')
          ? version === undefined
            ? babelFormats
            : ['es']
          : babelFormats,
      })),
    ];

    // documentation
    if (!this.updateOnly) {
      const answers = await this.prompt([
        {
          type: 'confirm',
          name: 'documentation',
          message: 'Would you like documentation (manually generated) ?',
          default:
            this.pobjson.documentation != null
              ? this.pobjson.documentation
              : true,
        },
      ]);

      this.pobjson.documentation = !!answers.documentation;
    }

    // testing
    if (!this.updateOnly) {
      const { testing } = await this.prompt({
        type: 'confirm',
        name: 'testing',
        message: 'Would you like testing ?',
        default: this.pobjson.testing || false,
      });
      this.pobjson.testing = !testing ? false : this.pobjson.testing || {};

      if (this.pobjson.testing) {
        const testingPrompts = await this.prompt([
          {
            type: 'confirm',
            name: 'circleci',
            message: 'Would you like circleci ?',
            default: this.pobjson.testing.circleci !== false,
          },
          // {
          //   type: 'confirm',
          //   name: 'travisci',
          //   message: 'Would you like travisci ?',
          //   default: this.pobjson.testing.travisci !== false,
          // },
          {
            type: 'confirm',
            name: 'codecov',
            message: 'Would you like codecov ?',
            default: this.pobjson.testing.codecov === true,
          },
        ]);
        Object.assign(this.pobjson.testing, testingPrompts);
      }
    }
  }

  default() {
    const withBabel = !!this.babelEnvs.length;
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));
    const withReact = packageUtils.hasReact(pkg);

    this.composeWith(require.resolve('../common/typescript'), {
      enable: withBabel,
      withReact,
      updateOnly: this.options.updateOnly,
    });

    this.composeWith(require.resolve('./babel'), {
      testing: !!this.pobjson.testing,
      documentation: !!this.pobjson.documentation,
      babelEnvs: JSON.stringify(this.babelEnvs),
      entries: JSON.stringify(this.pobjson.entries),
      fromPob: this.options.fromPob,
    });

    if (!withBabel) {
      mkdirp('lib');
    }

    if (!inLerna || inLerna.root) {
      this.composeWith(require.resolve('../common/husky'), {
        babelEnvs: JSON.stringify(this.babelEnvs),
      });
    }

    this.composeWith(require.resolve('../common/format-lint'), {
      babelEnvs: JSON.stringify(this.babelEnvs),
    });

    this.composeWith(require.resolve('../common/old-dependencies'));

    this.composeWith(require.resolve('./testing'), {
      enable: this.pobjson.testing,
      testing: this.pobjson.testing,
      documentation: !!this.pobjson.documentation,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
      circleci: this.pobjson.testing && this.pobjson.testing.circleci,
      // travisci: this.pobjson.testing && this.pobjson.testing.travisci,
      babelEnvs: JSON.stringify(this.babelEnvs),
    });

    this.composeWith(require.resolve('./doc'), {
      enabled: this.pobjson.documentation,
      testing: this.pobjson.testing,
    });

    this.composeWith(require.resolve('./readme'), {
      documentation: !!this.pobjson.documentation,
      testing: !!this.pobjson.testing,
      circleci: this.pobjson.testing && this.pobjson.testing.circleci,
      // travisci: this.pobjson.testing && this.pobjson.testing.travisci,
      codecov: this.pobjson.testing && this.pobjson.testing.codecov,
    });

    this.composeWith(require.resolve('../core/gitignore'), {
      root: !inLerna,
      withBabel: this.babelEnvs.length !== 0,
      documentation: this.pobjson.documentation,
    });
  }

  writing() {
    // Re-read the content at this point because a composed generator might modify it.
    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    if (inNpmLerna) {
      if (!pkg.engines) pkg.engines = {};
      pkg.engines.yarn = '< 0.0.0';
    }

    const withBabel = Boolean(this.babelEnvs.length);

    packageUtils.removeDevDependencies(pkg, ['lerna']);
    if (inLerna) {
      if (pkg.scripts) {
        delete pkg.scripts.preversion;
        delete pkg.scripts.release;
        delete pkg.scripts.version;
      }
    } else {
      packageUtils.addDevDependencies(pkg, [
        'pob-release',
        'repository-check-dirty',
      ]);
      packageUtils.addScripts(pkg, {
        release: 'repository-check-dirty && pob-release',
        preversion: [
          'yarn run lint',
          withBabel && 'yarn run build',
          this.pobjson.documentation && 'yarn run generate:docs',
          'repository-check-dirty',
        ]
          .filter(Boolean)
          .join(' && '),
        version: 'pob-version',
      });

      if (withBabel) {
        packageUtils.addScripts(pkg, {
          clean: 'rm -Rf dist',
        });
      } else {
        delete pkg.scripts.clean;
      }
    }

    if (!withBabel) {
      if (
        !this.fs.exists(this.destinationPath('lib/index.js')) &&
        this.fs.exists(this.destinationPath('index.js'))
      ) {
        this.fs.move(
          this.destinationPath('index.js'),
          this.destinationPath('lib/index.js')
        );
      }
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    execSync(
      `rm -Rf ${[
        'lib-*',
        'coverage',
        this.pobjson.documentation && 'docs',
        !withBabel && 'dist',
      ]
        .filter(Boolean)
        .join(' ')}`
    );

    const { pobjson } = this;

    pobjson.envs = this.babelEnvs;
    // .includes('node6') && 'node6',
    //   this.babelEnvs.includes('node8') && 'node8',
    //   this.babelEnvs.includes('olderNode') && 'older-node',
    //   this.babelEnvs.includes('moduleModernBrowsers') && 'module-modern-browsers',
    //   this.babelEnvs.includes('moduleAllBrowsers') && 'module',
    //   this.babelEnvs.includes('moduleNode8') && 'module-node8',
    //   this.babelEnvs.includes('browsers') && 'browsers',
    // ].filter(Boolean);

    this.config.set('pob-config', pobjson);
    this.config.save();
  }
};