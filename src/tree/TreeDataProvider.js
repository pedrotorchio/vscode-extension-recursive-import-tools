const vscode = require('vscode');
/**
 * @import { TreeDataProvider } from 'vscode';
 * @import { GlobalPath } from '../common/path/Path';
 * @import ModuleCache from './ModuleCache';
 * @import Labels from '../common/path/Labels';
 * @class @implements {TreeDataProvider<GlobalPath>}
 */
class ImportTreeDataProvider {
    /** @param {{ cache: ModuleCache, labels: Labels }} dependencies */
    constructor({ cache, labels }) {
        this.cache = cache;
        this.labels = labels;
        /** @type {GlobalPath[]} */
        this.roots = [];

        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    updateTree() {
        this._onDidChangeTreeData.fire();
    }

    /**
     * @param {GlobalPath[]} roots
     */
    setRoots(roots) {
        this.roots = roots;
        this.updateTree();
    }

    getTreeItem(/**@type {GlobalPath} */ path) {
        const element = this.cache.get(path);
        return {
            label: this.labels.get(element.name) ?? element.name.valueOf(),
            collapsibleState: element.imports.length > 0 ? 1 : 0,
            command: {
                command: 'recursive-import-tools.import-tree-open-file',
                title: 'Open file',
                arguments: [element]
            }
        };
    }
    getChildren(/**@type {GlobalPath}*/path) {
        if (!path) return this.roots;
        if (!this.cache.has(path)) return [];
        const element = this.cache.get(path);
        const imports = element.imports;
        // Only shows tree children if all of them are already cached
        if (imports.every(importPath => this.cache.has(importPath))) return imports;
        return [];
    }
}

module.exports = ImportTreeDataProvider;