const EventEmitter = require('events');
const clean = require('./clean');
const _build = require('./_build');
const { logger } = require('./logger');

module.exports = function build(pobrc, cwd, envs, watch = false) {
    if (!envs) {
        envs = pobrc.envs;

        if (envs.includes('node5')) {
            logger.warn('node5 is deprecated.');
            envs = envs.filter(env => env === 'node5');
        }

        envs = envs.reduce((res, env) => {
            res.push(env, `${env}-dev`);
            return res;
        }, []);
    }

    clean(envs);

    if (watch) {
        watch = new EventEmitter();
    }

    return Promise.all([
        _build(pobrc, cwd, pobrc.src || 'src', env => `lib-${env}`, envs, watch),
        pobrc.testing && _build(pobrc, cwd, 'test/src', () => 'test/node6', ['node6'], watch),
    ]).then(() => watch);
};