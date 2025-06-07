/**
 * @typedef {string & { __importType: 'library' }} LibraryImportPath
 * @typedef {string & { __importType: 'relative' }} RelativeImportPath
 * @typedef {string & { __importType: 'global' }} GlobalPath
 * @typedef {LibraryImportPath | RelativeImportPath | GlobalPath} PathString
 * @typedef {PathString extends { __importType: infer Type } ? Type : never} PathType
 */

/**
 * @param {unknown} v
 * @return {v is null | undefined}
 */
const isNil = (v) => v === null || v === undefined;

/**
 * Creates a typed path object.
 * @param {string} rawPath
 * @param {PathType} type
 * @returns {PathString}
 */
function Path(rawPath, type) {
    const withUnixSeparators = rawPath.replaceAll(/\\/g, '/');
    // @ts-ignore
    return Object.defineProperty(new String(withUnixSeparators), '__importType', {
        value: type,
        enumerable: false,
        writable: false,
    });
}

/**
 * Creates a global path.
 * @param {string | null | undefined} rawPath
 * @returns {GlobalPath}
 */
function Global(rawPath) {
    if (isNil(rawPath)) {
        throw new Error('Global path cannot be undefined or empty');
    }
    return /** @type {GlobalPath} */ (Path(rawPath, 'global'));
}

/**
 * Creates a relative path.
 * @param {string | null | undefined} rawPath
 * @returns {RelativeImportPath}
 */
function Relative(rawPath) {
    if (isNil(rawPath)) {
        throw new Error('Relative path cannot be undefined or empty');
    }
    return /** @type {RelativeImportPath} */ (Path(rawPath, 'relative'));
}

/**
 * Creates a library path.
 * @param {string | null | undefined} rawPath
 * @returns {LibraryImportPath}
 */
function Library(rawPath) {
    if (isNil(rawPath)) {
        throw new Error('Library path cannot be undefined or empty');
    }
    return /** @type {LibraryImportPath} */ (Path(rawPath, 'library'));
}

module.exports = {
    Path,
    Global,
    Relative,
    Library
};