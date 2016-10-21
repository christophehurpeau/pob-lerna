const resolvePreset = function (presetName) {
  return require.resolve(`babel-preset-${presetName}`);
};

const resolvePlugin = function (pluginName) {
  return require.resolve(`babel-plugin-${pluginName}`);
};

module.exports = function createOpts(env, react) {
  const production = !env.endsWith('-dev');

  if (!production) {
    env = env.slice(0, -4);
  }

  if (env === 'doc') {
    return {
      presets: [
        'jsdoc',
        'jsdoc/object-rest',
        react && 'react',
        resolvePreset('stage-1'),
      ].filter(Boolean),
      plugins: [
        'add-jsdoc-annotations',
        resolvePlugin('transform-flow-strip-types'),
      ]
    };
  }

  let presets;
  let browser;
  let modernBrowsers = false;

  switch (env) {
    case 'es5':
      throw new Error('use olderNode instead.');

    case 'test':
    case 'node6':
      presets = [
        'es2015-node6/object-rest',
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = false;
      break;

    case 'older-node':
      presets = [
        'es2015',
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = false;
      break;

    case 'webpack':
      presets = [
        ['es2015', { modules: false }],
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = true;
      break;

    case 'webpack-modern-browsers':
      presets = [
        ['modern-browsers', { modules: false, objectRest: true }],
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = true;
      modernBrowsers = true;
      break;

    case 'browsers':
      presets = [
        'es2015',
        react && 'react',
        resolvePreset('stage-1'),
      ];
      browser = true;
      break;

    default:
      throw new Error(`Unsupported env ${env}`);

  }

  return {
    presets: presets.filter(Boolean),
    plugins: [
      resolvePlugin('syntax-flow'),
      !production && resolvePlugin('tcomb-forked'),
      resolvePlugin('transform-flow-strip-types'),
      react && resolvePlugin('react-require'),
      // browser && 'react-hot-loader/babel',
      !production && react && resolvePlugin('transform-react-jsx-self'),
      !production && react && resolvePlugin('transform-react-jsx-source'),
      [resolvePlugin('import-rename'), { '^([a-z\\-]+)/src(.*)$': '$1$2' }],

      [resolvePlugin('minify-replace'), {
          replacements: [
              {
                  identifierName: 'PRODUCTION',
                  replacement: { type: 'booleanLiteral', value: production },
              },
              {
                  identifierName: 'BROWSER',
                  replacement: { type: 'booleanLiteral', value: browser },
              },
              {
                  identifierName: 'SERVER',
                  replacement: { type: 'booleanLiteral', value: !browser },
              },
              {
                  identifierName: 'NODEJS',
                  replacement: { type: 'booleanLiteral', value: !browser },
              },
          ],
      }],
      resolvePlugin('minify-constant-folding'),
      [resolvePlugin('minify-dead-code-elimination'), { keepFnName: true, keepFnames: true }],
      resolvePlugin('minify-guarded-expressions'),
      resolvePlugin('discard-module-references'),
    ].filter(Boolean).concat(createOpts.plugins || [])
  };
};
