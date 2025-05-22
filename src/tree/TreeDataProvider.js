const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from './ModuleDefinition';
 * @import { TreeDataProvider } from 'vscode';
 * @import { GlobalPath } from '../common/path/Path';
 * @import ModuleCache from './ModuleCache';
 * @import Labels from '../common/path/Labels';
 * @class @implements {TreeDataProvider<ModuleDefinition>}
 */
class ImportTreeDataProvider {
    /** @param {{ cache: ModuleCache, labels: Labels }} dependencies */
    constructor({ cache, labels }) {
        this.cache = cache;
        this.labels = labels;
        /** @type {ModuleDefinition[]} */
        this.tree = [];

        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    updateTree() {
        this._onDidChangeTreeData.fire();
    }

    /**
     * 
     * @param {GlobalPath} path 
     * @returns {ModuleDefinition}
     */
    createItem(path) {
        const item = this.cache.get(path);
        if (item) return item;

        /**@type {Partial<ModuleDefinition>}*/
        const newItem = {
            path,
            imports: [],
            setLabel: (label) => {
                this.labels.set(newItem.name, label);
                this.updateTree();
            },
        }
        const typedItem = /** @type {ModuleDefinition} */(newItem);

        this.cache.set(path, typedItem);
        return typedItem;
    }

    /**
     * @param {ModuleDefinition} item
     */
    setItem(item) {
        this.cache.set(item.path, item);
    }

    /**
     *
     * @param {GlobalPath} path
     * @returns {ModuleDefinition | null}
     */
    getItem(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }
        return null;
    }
    /**
     * @param {ModuleDefinition[]} tree
     */
    setTree(tree) {
        this.tree = tree;
        this.updateTree();
    }

    getTreeItem(/**@type {ModuleDefinition} */ element) {
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
    getChildren(/**@type {ModuleDefinition}*/element) {
        if (!element) return this.tree;
        if (!element.hasResolvedImports) return [];
        return element.imports;
    }
}


module.exports = ImportTreeDataProvider;