/**
 * @import { RelativeImportPath, LibraryImportPath } from './Path.js';
 * @import { ExtensionContext } from 'vscode';
 */
module.exports = class Labels {
    static KEY_LABEL_PREFIX = 'recursive-import-tools.path-label';
    static mkKey = (/** @type {RelativeImportPath | LibraryImportPath} */path) => `${Labels.KEY_LABEL_PREFIX}.${path.valueOf()}`;

    /** @param {ExtensionContext} context*/
    constructor(context) {
        this.context = context;
        this.cache = new Map();
    }

    async refresh() {
        this.cache.clear();
    }

    /**
     * @param {RelativeImportPath | LibraryImportPath} path 
     * @returns {string}
     */
    get(path) {
        const key = Labels.mkKey(path);
        return this.cache.get(key);
    }

    /**
     * @param {RelativeImportPath | LibraryImportPath} path 
     * @param {string} label
     * @returns {Promise<string>}
     */
    async set(path, label) {
        const key = Labels.mkKey(path);
        this.cache.set(key, label);

        await this.context.workspaceState.update(key, label);

        return label;
    }
}