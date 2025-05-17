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

    writeToCache(/** @type {ModuleDefinition} */ module) {
        this.importCache.set(module.path.valueOf(), module);
    }
    readFromCache(/** @type {string} */ path) {
        return this.importCache.get(path) ?? null;
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