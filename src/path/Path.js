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

module.exports = {
    Path,
    Global,
    Relative,
    Library
};