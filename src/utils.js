/**
 * @import { GlobalPath } from './Path';
 */
const vscode = require('vscode');
const { join } = require('./Path');
/**
 * Checks if a file exists asynchronously.
 * @param {GlobalPath} basePath
 * @param {string} [optionalPath]
 * @returns {Promise<boolean>}
 */
async function existsASync(basePath, optionalPath) {
    const file = vscode.Uri.file(optionalPath ? join(basePath, optionalPath) : basePath);
    return vscode.workspace.fs.stat(file).then(
        a => a.type === vscode.FileType.File,
        e => (e.code === 'FileNotFound' ? false : Promise.reject(e))
    );
}

/**
 * Finds the first existing file in a list of paths.
 * @param {GlobalPath[]} paths
 * @returns {Promise<string | null>}
 */
async function findExistingFileInList(paths) {
    for (const path of paths) {
        if (await existsASync(path)) {
            return path;
        }
    }
    return null;
}

module.exports = {
    existsASync,
    findExistingFileInList
};