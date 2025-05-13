const path = require('path');

/**
 * @typedef {string & { __importType: 'library' }} LibraryImportPath
 * @typedef {string & { __importType: 'relative' }} RelativeImportPath
 * @typedef {string & { __importType: 'global' }} GlobalPath
 * @typedef {LibraryImportPath | RelativeImportPath | GlobalPath} PathString
 * @typedef {PathString extends { __importType: infer Type } ? Type : never} PathType
 */

/**
 * Creates a typed path object.
 * @param {string} rawPath
 * @param {PathType} type
 * @returns {PathString}
 */
function Path(rawPath, type) {
    // @ts-ignore
    return Object.defineProperty(new String(rawPath), '__importType', {
        value: type,
        enumerable: false,
        writable: false,
    });
}

/**
 * Gets the type of a path.
 * @param {PathString} path
 * @returns {PathType}
 */
function type(path) {
    return path.__importType;
}

/**
 * Creates a global path.
 * @param {string} rawPath
 * @returns {GlobalPath}
 */
function Global(rawPath) {
    return /** @type {GlobalPath} */ (Path(rawPath, 'global'));
}

/**
 * Creates a relative path.
 * @param {string} rawPath
 * @returns {RelativeImportPath}
 */
function Relative(rawPath) {
    return /** @type {RelativeImportPath} */ (Path(rawPath, 'relative'));
}

/**
 * Creates a library path.
 * @param {string} rawPath
 * @returns {LibraryImportPath}
 */
function Library(rawPath) {
    return /** @type {LibraryImportPath} */ (Path(rawPath, 'library'));
}

/**
 * Joins a base path with a relative path.
 * @template {PathString} T
 * @param {T} basePath
 * @param {string} relativePath
 * @returns {T}
 */
function join(basePath, relativePath) {
    return /** @type {T} */ (Path(path.join(basePath.valueOf(), relativePath.valueOf()), type(basePath)));
}

/**
 * Resolves a base path with a relative path.
 * @template {PathString} T
 * @param {T} basePath
 * @param {string} relativePath
 * @returns {T}
 */
function resolve(basePath, relativePath) {
    return /** @type {T} */ (path.resolve(basePath.valueOf(), relativePath.valueOf()));
}

/**
 * Concatenates multiple paths.
 * @template {PathString} T
 * @param {T} firstPath
 * @param {...string} paths
 * @returns {T}
 */
function concat(firstPath, ...paths) {
    const concatenatedPath = paths.reduce((acc, cur) => acc + cur.valueOf(), firstPath.valueOf());
    return /** @type {T} */ (Path(concatenatedPath, type(firstPath)));
}

module.exports = {
    Path,
    type,
    Global,
    Relative,
    Library,
    join,
    resolve,
    concat
};