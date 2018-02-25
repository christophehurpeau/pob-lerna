# pob [![NPM version][npm-image]][npm-url]

Pile Of Bones / Place Of Birth / Point Of Beginning 
Library generator with git/babel/eslint/readme/editorconfig/jest/jsdoc/circleci/travis.
Better than a skeleton !

## How to install

```
npm install -g pob
mkdir some-lib
cd some-lib
pob
```

### Perfect !

You can now use `yarn run watch` !

### How this works

#### Babel

Write code in the `src` directory, it's then transpiled with babel and rollup to `dist`.
Use the task `yarn run build` or `yarn run watch` to transpile the code.

There are several environments: `node`, `browser`.
For each of these environments, there is also a `dev` version that add flow runtime checks.

#### Coding Rules

Eslint is used to ensure a common coding style. I mostly follow the [Airbnb coding style](https://github.com/airbnb/javascript/blob/master/README.md).
You can check the code by running the task `yarn run lint`. With an editor, install the plugins to validate the code as you type !

#### Documentation

[jsdoc](http://usejsdoc.org/) allows to document the code and generate the api.
[jest](https://www.npmjs.com/package/jest) is used to generate the coverage.
You can generate the documentation with `yarn run generate:docs`.

Documentation can be generated by circleci and pushed to github-pages.

#### Tests

Tests are in the directory `src` with jest. Use the task `yarn test` to run the tests with jest.

### Available tasks with `yarn run`

#### Code, Transpile, Lint

- `build`: `clean` the directory, build `src` to `dist` with rollup
- `watch`: `clean` then build and watch with rollup
- `lint`: execute `eslint`
- `test`: run tests with jest

### Generate documentation

- `generate:docs`: run `generate:api` and `generate:test-coverage`
- `generate:api`: generate api with jsdoc
- `generate:test-coverage`: generate coverage documentation

### Publish a new release

- `yarn run release`

In the process, this will pre-generate a changelog based on the commits, then open nano so you can adapt it if you want.

[npm-image]: https://img.shields.io/npm/v/pob.svg?style=flat
[npm-url]: https://npmjs.org/package/pob
