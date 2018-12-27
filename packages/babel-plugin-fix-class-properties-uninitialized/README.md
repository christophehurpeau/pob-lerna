<h3 align="center">
  babel-plugin-fix-class-properties-uninitialiazed
</h3>

<p align="center">
  babel plugin for pob-babel
</p>

<p align="center">
  <a href="https://npmjs.org/package/babel-plugin-fix-class-properties-uninitialiazed"><img src="https://img.shields.io/npm/v/babel-plugin-fix-class-properties-uninitialiazed.svg?style=flat-square"></a>
  <a href="https://david-dm.org/christophehurpeau/pob?path=packages/babel-plugin-fix-class-properties-uninitialiazed"><img src="https://david-dm.org/christophehurpeau/pob?path=packages/babel-plugin-fix-class-properties-uninitialiazed.svg?style=flat-square"></a>
</p>

## Install

```bash
npm install --save babel-plugin-fix-class-properties-uninitialiazed
```

## Usage with .babelrc

```json
{
  "presets": ["@babel/preset-env"],
  "plugins": [
    "babel-plugin-fix-class-properties-uninitialized",
    "@babel/plugin-proposal-class-properties"
  ]
}
```

## What does it do ?

Fixes when you have unitialized properties, for example with `@babel/preset-typescript`:


```typescript
class Foo extends Bar {
  prop!: string;  
}
```

```js
class Foo extends Bar {
  constructor() {
    super();
    this.prop = void 0;
  }  
}
```

Except it causes an issue if prop is setup in the constructor of Bar.
This plugin removes the uninitialized prop so that @babel/plugin-proposal-class-properties does not process it. 

