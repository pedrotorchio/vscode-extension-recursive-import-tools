const { Path } = require('./Path');
const path = require('path');
const fs = require('fs');

/**
 * @import { GlobalPath, PathString, PathType } from './Path';
 */

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

/**
 * Gets the type of a path.
 * @param {PathString} path
 * @returns {PathType}
 */
function type(path) {
    return path.__importType;
}

/**
 * Checks if a path exists.
 * @param {PathString} pathString
 * @returns {string}
 */
function ext(pathString) {
    return path.extname(pathString.valueOf());
}

module.exports = {
    join,
    resolve,
    concat,
    type,
    ext
}