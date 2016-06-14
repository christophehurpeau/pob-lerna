function sortObject(obj, keys = []) {
    const objCopy = Object.assign({}, obj);
    const objKeys = Object.keys(obj);
    objKeys.forEach(key => delete obj[key]);
    keys.filter(key => objCopy.hasOwnProperty(key))
        .concat(objKeys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())))
        .forEach(key => obj[key] = objCopy[key]);
    return obj;
}

function _addToObject(pkg, key, object) {
    if (!pkg[key]) {
        pkg[key] = {};
        exports.sort(pkg);
    }
    const value = pkg[key];
    Object.assign(value, object);
    pkg[key] = sortObject(pkg[key]);
}

exports.sort = function sort(pkg) {
    return sortObject(pkg, [
        'name',
        'private',
        'version',
        'description',
        'keywords',
        'author',
        'contributors',
        'license',
        'repository',
        'homepage',
        'bugs',
        'preferGlobal',
        'engines',
        'engineStrict',
        'os',
        'cpu',
        'main',
        'jsnext:main',
        'browser',
        'browser-dev',
        'browserify',
        'webpack:main',
        'webpack:main-dev',
        'webpack:main-modern-browsers',
        'webpack:main-modern-browsers-dev',
        'config',
        'style',
        'bin',
        'man',
        'scripts',
        'directories',
        'files',
        'babel',
        'eslintConfig',
        'stylelint',
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'bundledDependencies',
        'bundleDependencies',
        'optionalDependencies',
    ]);
};

exports.extend = function extend(pkg, props) {
    pkg = Object.assign({}, props, pkg);
    return exports.sort(pkg);
};

exports.addDependencies = function addDependencies(pkg, dependencies) {
    _addToObject(pkg, 'dependencies', dependencies);
};

exports.addDependency = function addDependency(pkg, dependency, version) {
    exports.addDependencies(pkg, { [dependency]: version });
};

exports.addDevDependencies = function addDevDependencies(pkg, dependencies) {
    _addToObject(pkg, 'devDependencies', dependencies);
};

exports.addDevDependency = function addDevDependency(pkg, dependency, version) {
    exports.addDevDependencies(pkg, { [dependency]: version });
};

exports.addScripts = function addScripts(pkg, scripts) {
    _addToObject(pkg, 'scripts', scripts);
};

exports.addScript = function addScript(pkg, scriptName, value) {
    exports.addScripts(pkg, { [scriptName]: value });
};

