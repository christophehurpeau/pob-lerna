const generators = require('yeoman-generator');
const askName = require('inquirer-npm-name');
const parseAuthor = require('parse-author');
const githubUsername = require('github-username');
const kebabCase = require('lodash.kebabcase');
const path = require('path');

module.exports = generators.Base.extend({
    constructor: function() {
        generators.Base.apply(this, arguments);

        /* this.option('boilerplate', {
            type: Boolean,
            required: true,
            desc: 'boilerplate: node-lib or browser-lib or isomorphic-lib'
        }); */

        this.option('babel', {
            type: Boolean,
            required: false,
            defaults: true,
            desc: 'Use babel'
        });

        this.option('license', {
            type: Boolean,
            required: false,
            defaults: true,
            desc: 'Include a license'
        });

        this.option('name', {
            type: String,
            required: false,
            desc: 'Project name'
        });

        this.option('githubAccount', {
            type: String,
            required: false,
            desc: 'GitHub username or organization'
        });

        this.option('projectRoot', {
            type: String,
            required: false,
            defaults: 'lib',
            desc: 'Relative path to the project code root'
        });
    },

    initializing() {
        this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

        // Pre set the default props from the information we have at this point
        this.props = {
            name: this.pkg.name,
            description: this.pkg.description,
            version: this.pkg.version,
            homepage: this.pkg.homepage,
        };

        if (typeof this.pkg.author === 'object') {
            this.props.authorName = this.pkg.author.name;
            this.props.authorEmail = this.pkg.author.email;
            this.props.authorUrl = this.pkg.author.url;
        } else if (typeof this.pkg.author === 'string') {
            const parsedAuthor = parseAuthor(this.pkg.author);
            this.props.authorName = parsedAuthor.name;
            this.props.authorEmail = parsedAuthor.email;
            this.props.authorUrl = parsedAuthor.url;
        }
    },

    prompting: {
        askForModuleName() {
            if (this.pkg.name || this.options.name) {
                this.props.name = this.pkg.name || this.options.name;
                return;
            }

            const done = this.async();

            askName({
                name: 'name',
                message: 'Module Name',
                default: path.basename(process.cwd()),
                filter: kebabCase,
                validate: str => str.length > 0,
            }, this, name => {
                this.props.name = name;
                done();
            });
        },

        askFor() {
            var done = this.async();

            var prompts = [{
                name: 'description',
                message: 'Description',
                when: !this.props.description,
            }, {
                name: 'authorName',
                message: 'Author\'s Name',
                when: !this.props.authorName,
                default: this.user.git.name(),
                store: true,
            }, {
                name: 'authorEmail',
                message: 'Author\'s Email',
                when: !this.props.authorEmail,
                default: this.user.git.email(),
                store: true,
            }, {
                name: 'authorUrl',
                message: 'Author\'s Homepage',
                when: !this.props.authorUrl,
                store: true,
            }, {
                type: 'checkbox',
                name: 'babelEnvs',
                message: 'Babel envs:',
                choices: [{
                    name: 'Node6',
                    value: 'node6',
                    checked: true,
                }, {
                    name: 'Node5',
                    value: 'node5',
                    checked: true,
                }, {
                    name: 'es5',
                    value: 'es5',
                    checked: true,
                }, {
                    name: 'Modern browsers (latest version of firefox and chrome)',
                    value: 'modernBrowsers',
                    checked: false,
                }]
            }, {
                type: 'checkbox',
                name: 'features',
                message: 'What would you like?',
                choices: [{
                    name: 'Syntax React: babel preset-react',
                    value: 'react',
                    checked: false,
                }, {
                    name: 'Testing: mocha + istanbul',
                    value: 'includeTesting',
                    checked: true,
                /*}, {
                    name: 'Browser Testing: karma',
                    value: 'includeBrowserTesting',
                    checked: false,*/
                }, {
                    name: 'Documentation: jsdoc',
                    value: 'includeDocumentation',
                    checked: false,
                }]
            }];

            this.prompt(prompts, props => {
                this.props = Object.assign(this.props, props);
                if (this.props.features) {
                    this.props.features.forEach(feature => this.props[feature] = true);
                }
                done();
            });
        },

        askForGithubAccount() {
            if (this.options.githubAccount) {
                this.props.githubAccount = this.options.githubAccount;
                return;
            }

            const done = this.async();

            githubUsername(this.props.authorEmail, (err, username) => {
                if (err) {
                    username = username || '';
                }

                this.prompt({
                    name: 'githubAccount',
                    message: 'GitHub username or organization',
                    default: username
                }, prompt => {
                    this.props.githubAccount = prompt.githubAccount;
                    done();
                });
            });
        },
    },

    default() {
        if (!this.props.homepage && this.props.githubAccount) {
            this.props.homepage = `https://github.com/${this.props.githubAccount}/${this.props.name}`;
        }

        if (this.options.license && !this.fs.exists(this.destinationPath('LICENSE'))) {
            this.composeWith('license', {
                options: {
                    name: this.props.authorName,
                    email: this.props.authorEmail,
                    website: this.props.authorUrl,
                    defaultLicense: 'ISC',
                }
            }, {
                local: require.resolve('generator-license/app'),
            });
        }

        this.composeWith('pob:git', {
            options: {
                name: this.props.name,
                githubAccount: this.props.githubAccount,
            }
        }, {
            local: require.resolve('../git'),
        });

        this.composeWith('pob:editorconfig', {}, {
            local: require.resolve('../editorconfig'),
        });

        this.composeWith('pob:eslint', {
            options: {
                babel: this.options.babel,
                react: this.props.react,
                testing: this.props.includeTesting,
            },
        }, {
            local: require.resolve('../eslint'),
        });

        if (this.options.babel) {
            this.composeWith('pob:babel', {
                options: {
                    testing: this.props.includeTesting,
                    react: this.props.react,
                    env_doc: this.props.includeDocumentation,
                    env_es5: this.props.babelEnvs.includes('es5'),
                    env_node5: this.props.babelEnvs.includes('node5'),
                    env_node6: this.props.babelEnvs.includes('node6'),
                    env_modern_browsers: this.props.babelEnvs.includes('modernBrowsers'),
                },
            }, {
                local: require.resolve('../babel'),
            });
        }

        /* if (this.options.boilerplate) {
            this.composeWith(`pob:boilerplate`, {
                options: {
                    babelEnvs: this.props.babelEnvs,
                    name: this.props.name,
                }
            }, {
                local: require.resolve(`./boilerplate-${this.options.boilerplate}`),
            });
        } */

        if (!this.fs.exists(this.destinationPath('README.md'))) {
            this.composeWith('pob:readme', {
                options: {
                    name: this.props.name,
                    description: this.props.description,
                    githubAccount: this.props.githubAccount,
                    authorName: this.props.authorName,
                    authorEmail: this.props.authorEmail,
                    authorUrl: this.props.authorUrl,
                    testing: this.props.includeTesting,
                    coveralls: this.props.includeCoveralls,
                    content: this.options.readme
                }
            }, {
                local: require.resolve('../readme')
            });
        }

        if (this.props.includeTesting) {
            this.composeWith('pob:testing', {
                options: {
                    babel: this.options.babel,
                    react: this.props.react,
                }
            }, {
                local: require.resolve('../testing'),
            });
        }

        if (this.props.includeDocumentation) {
            this.composeWith('pob:doc', {
                options: {
                    name: this.props.name,
                    testing: this.props.includeTesting
                }
            }, {
                local: require.resolve('../doc'),
            });
        }
    },

    writing() {
        // Re-read the content at this point because a composed generator might modify it.
        const currentPkg = this.fs.readJSON(this.destinationPath('package.json'), {});

        const pkg = Object.assign({
            name: kebabCase(this.props.name),
            version: '0.0.0',
            description: this.props.description,
            homepage: this.props.homepage,
            author: `${this.props.authorName} <${this.props.authorEmail}>${
                this.props.authorUrl && ` (${this.props.authorUrl})`}`,
            keywords: []
        }, currentPkg);

        const scripts = pkg.scripts || (pkg.scripts = {});;

        scripts.release = 'pob-repository-check-clean && pob-release';
        scripts.preversion = 'npm run lint && npm run build && npm run build && pob-repository-check-clean';
        scripts.version = 'pob-version';
        scripts.clean = 'rm -Rf docs dist test/node6 coverage';
        scripts.prepublish = 'ln -s ../../git-hooks/pre-commit .git/hooks/pre-commit || echo';

        pkg.devDependencies = pkg.devDependencies || {};
        Object.assign(pkg.devDependencies, {
            'pob-release': '^2.0.0',
        });

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    },

    installing() {
        this.npmInstall();
    },

    configuring() {
        this.mkdir('src');
    },

    end() {
    }
});
