const generators = require('yeoman-generator');
const camelCase = require('lodash.camelcase');

module.exports = generators.Base.extend({
    constructor: function() {
        generators.Base.apply(this, arguments);
        this.option('destination', {
            type: String,
            required: false,
            defaults: '',
            desc: 'Destination of the generated files.'
        });

        this.option('name', {
            type: String,
            required: true,
            desc: 'Project name'
        });

        this.option('description', {
            type: String,
            required: true,
            desc: 'Project description'
        });

        this.option('githubAccount', {
            type: String,
            required: true,
            desc: 'User github account'
        });

        this.option('authorName', {
            type: String,
            required: true,
            desc: 'Author name'
        });

        this.option('authorUrl', {
            type: String,
            required: true,
            desc: 'Author url'
        });


        this.option('documentation', {
            type: Boolean,
            required: true,
            desc: 'Include documentation'
        });

        this.option('testing', {
            type: Boolean,
            required: true,
            desc: 'Include testing badge'
        });

        this.option('doclets', {
            type: Boolean,
            required: true,
            desc: 'Include doclets.io link'
        });

        this.option('circleci', {
            type: Boolean,
            required: true,
            desc: 'circleci badge and documentation link'
        });

        this.option('travisci', {
            type: Boolean,
            required: true,
            desc: 'travisci badge'
        });

        this.option('coveralls', {
            type: Boolean,
            required: true,
            desc: 'Include coveralls badge'
        });

        this.option('content', {
            type: String,
            required: false,
            desc: 'Readme content'
        });
    },

    writing() {
        const pkg = this.fs.readJSON(this.destinationPath(this.options.destination, 'package.json'), {});

        try {
        this.fs.copyTpl(
            this.templatePath('README.md.ejs'),
            this.destinationPath(this.options.destination, 'README.md'),
            {
                projectName: this.options.name,
                camelCaseProjectName: camelCase(this.options.name),
                description: this.options.description,
                githubAccount: this.options.githubAccount,
                author: {
                    name: this.options.authorName,
                    url: this.options.authorUrl
                },
                license: pkg.license,
                doclets: this.options.doclets,
                coveralls: this.options.coveralls,
                documentation: this.options.documentation,
                testing: this.options.testing,
                circleci: this.options.circleci,
                travisci: this.options.travisci,
                content: this.options.content
            }
        );
        } catch (err) {
            console.log(err.stack || err.message || err);
            throw err;
        }
    },
});
