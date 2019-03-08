'use strict';

const { readlinkSync } = require('fs');
const { execSync } = require('child_process');
const Generator = require('yeoman-generator');
const packageUtils = require('../../../utils/package');

module.exports = class GitHooksGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('destination', {
      type: String,
      required: false,
      defaults: '',
      desc: 'Destination of the generated files.',
    });
  }

  writing() {
    execSync('rm -Rf git-hooks/');

    const gitHookDestination = this.destinationPath('.git/hooks/pre-commit');
    let isSymlink;

    try {
      readlinkSync(gitHookDestination);
      isSymlink = true;
    } catch (err) {
      isSymlink = false;
    }

    if (isSymlink) {
      this.fs.delete('.git/hooks/prepare-commit-msg');
      this.fs.delete('.git/hooks/post-checkout');
      this.fs.delete('.git/hooks/post-merge');
      this.fs.delete('.git/hooks/pre-commit');
    }

    this.fs.delete('.git-hooks/prepare-commit-msg');
    this.fs.delete('.git-hooks/post-checkout');
    this.fs.delete('.git-hooks/post-merge');
    this.fs.delete('.git-hooks/pre-commit');
    this.fs.delete('.git-hooks');

    const pkg = this.fs.readJSON(this.destinationPath('package.json'));

    packageUtils.removeDevDependencies(pkg, ['komet', 'komet-karma']);

    packageUtils.addDevDependencies(pkg, [
      'husky',
      'yarnhook',
      'lint-staged',
      'yarn-update-lock',
      '@commitlint/cli',
      '@commitlint/config-conventional',
    ]);
    // packageUtils.addOrRemoveDevDependencies(pkg, inLerna, {
    //   '@commitlint/config-lerna-scopes': '6.1.3',
    // });

    pkg.commitlint = {
      extends: [
        '@commitlint/config-conventional',
        // '@commitlint/config-lerna-scopes',
      ].filter(Boolean),
    };

    pkg.husky = {
      hooks: {
        'commit-msg': 'commitlint -e $HUSKY_GIT_PARAMS',
        'post-checkout': 'yarnhook',
        'post-merge': 'yarnhook',
        'post-rewrite': 'yarnhook',
        'pre-commit': 'lint-staged',
      },
    };

    delete pkg.scripts.commitmsg;
    delete pkg.scripts.precommit;
    delete pkg.scripts.prepublish;
    delete pkg.scripts.prepare;
    delete pkg.scripts.preparecommitmsg;
    delete pkg.scripts.postcheckout;
    delete pkg.scripts.postmerge;
    delete pkg.scripts.postrewrite;
    delete pkg.scripts.postpublish;

    const hasBabel = packageUtils.transpileWithBabel(pkg);
    const hasReact = hasBabel && packageUtils.hasReact(pkg);
    const useTypescript = packageUtils.hasTypescript(pkg);
    const srcDirectory = hasBabel ? 'src' : 'lib';
    const ext = useTypescript ? 'ts' : 'js';

    pkg['lint-staged'] = {
      'yarn.lock': ['yarn-update-lock', 'git add'],
      // [`{README.md,package.json${inLerna ? ',packages/*/package.json,packages/*/README.md,' : ''},.eslintrc.json}`]: [
      [`{package.json${
        pkg.workspaces
          ? `,${pkg.workspaces.map((path) => `${path}/package.json`).join(',')}`
          : ''
      },.eslintrc.json}`]: ['prettier --parser json --write', 'git add'],
      [`${
        pkg.workspaces ? `{${pkg.workspaces.join(',')}}/` : ''
      }${srcDirectory}/**/*.json`]: [
        'prettier --parser json --write',
        'git add',
      ],
      [`${
        pkg.workspaces ? `{${pkg.workspaces.join(',')}}/` : ''
      }${srcDirectory}/**/*.${
        hasReact
          ? `{${ext === 'js' ? '' : 'js,'}${ext},${ext}x}`
          : ext === 'js'
          ? ext
          : `{js,${ext}}`
      }`]: ['eslint --fix --quiet', 'git add'],
    };

    // if (packageUtils.hasLerna(pkg)) {
    //   packageUtils.addScript(pkg, 'postinstall', 'repository-check-dirty && lerna bootstrap');
    // }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg);

    const cwd = this.destinationPath();

    if (this.spawnCommandSync('git', ['status'], { cwd }).status === 128) {
      this.spawnCommandSync('git', ['init'], { cwd });

      if (!this.originUrl) {
        let repoSSH = pkg.repository;
        if (pkg.repository && pkg.repository.indexOf('.git') === -1) {
          /* this.spawnCommandSync('curl', [
                        '--silent',
                        '--write-out',
                        '"%{http_code}"',
                        '--output',
                        '/dev/null',
                        '-i',
                        '-u',
                        this.options.githubAccount,
                        `-d "{"name": "${this.options.name}", "auto_init": true}`,
                        'https://api.github.com/user/repos',
                    ], { cwd }); */

          repoSSH = pkg.repository;
        }

        this.spawnCommandSync('git', ['remote', 'add', 'origin', repoSSH], {
          cwd,
        });
      }
    }
  }

  end() {
    this.spawnCommandSync('node', [
      'node_modules/husky/lib/installer/bin.js',
      'install',
    ]);
  }
};