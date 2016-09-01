const generators = require('yeoman-generator');
const packageUtils = require('../../utils/package');

module.exports = generators.Base.extend({
    constructor: function() {
        generators.Base.apply(this, arguments);
        this.option('destination', {
            type: String,
            required: false,
            defaults: '',
            desc: 'Destination of the generated files.'
        });

        this.option('circleci', {
            type: Boolean,
            required: true,
            desc: 'circleci'
        });

        this.option('travisci', {
            type: Boolean,
            required: true,
            desc: 'travisci'
        });

        this.option('coveralls', {
            type: Boolean,
            required: true,
            desc: 'Include coveralls report'
        });

        this.option('documentation', {
            type: Boolean,
            required: true,
            desc: 'Include documentation generation'
        });
    },

    initializing() {
        this.mkdir(this.destinationPath(this.options.destination, 'test/src'));
        const testIndexPath = this.destinationPath(this.options.destination, 'test/src/index.js');
        if (!this.fs.exists(testIndexPath)) {
            this.fs.copy(this.templatePath('index.js'), testIndexPath);
        }
    },

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        packageUtils.addScripts(pkg, {
            test: 'mocha --harmony --es_staging --recursive --bail -u tdd test/node6',
            'generate:test-coverage': [
                'rm -Rf coverage/',
                'node --harmony --es_staging node_modules/istanbul/lib/cli.js'
                    + ' cover node_modules/.bin/_mocha -- --recursive --reporter=spec -u tdd test/node6',
            ].join(' ; ')
        });

        packageUtils.addDevDependencies(pkg, {
            'mocha': '^3.0.0',
            'istanbul': '^0.4.3',
        });

        if (this.options.circleci) {
            packageUtils.addDevDependency(pkg, 'xunit-file', '^1.0.0');
        }

        if (this.options.coveralls) {
            packageUtils.addDevDependency(pkg, 'coveralls', '^2.11.11');
        }

        this.fs.writeJSON(this.destinationPath(this.options.destination, 'package.json'), pkg);

        if (this.options.circleci) {
            try {
            this.fs.copyTpl(
                this.templatePath('circle.yml.ejs'),
                this.destinationPath(this.options.destination, 'circle.yml'),
                {
                    documentation: this.options.documentation,
                    coveralls: this.options.coveralls,
                }
            );
            } catch (err) {
                console.log(err.stack || err.message || err);
                throw err;
            }
        }

        if (this.options.travisci) {
            this.fs.copy(
                this.templatePath('travis.yml'),
                this.destinationPath(this.options.destination, '.travis.yml')
            );
        }
    },
});
