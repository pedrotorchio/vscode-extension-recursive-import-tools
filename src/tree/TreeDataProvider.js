const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from './ModuleDefinition';
 * @import { TreeDataProvider } from 'vscode';
 * @class @implements {TreeDataProvider<ModuleDefinition>}
 */
class ImportTreeDataProvider {
    constructor() {
        /** @type {ModuleDefinition[]} */
        this.tree = [];
        /** @type {Map<string, ModuleDefinition>} */
        this.importCache = new Map();
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    /**
     * @param {Partial<ModuleDefinition>} module
     * @returns {ModuleDefinition} a new reference to the module object
     */
    setItem(module) {
        /**@type {ModuleDefinition}*/
        const completeModule = Object.assign({
            path: module.path,
            name: '',
            contents: '',
            extension: '',
            imports: [],
        }, module);
        this.importCache.set(module.path.valueOf(), completeModule);
        return completeModule;
    }
    /**
     * @param {string} path
     * @returns {ModuleDefinition|null}
     */
    getItem(path) {
        return this.importCache.get(path.valueOf()) ?? null;
    }

    setTree(/**@type {ModuleDefinition[]} */ tree) {
        this.tree = tree;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(/**@type {ModuleDefinition} */ element) {
        return {
            label: element.name.valueOf(),
            collapsibleState: element.imports.length > 0 ? 1 : 0
        };
    }
    getChildren(/**@type {ModuleDefinition}*/element) {
        if (!element) return this.tree;
        return element.imports;
    }
}

module.exports = ImportTreeDataProvider;