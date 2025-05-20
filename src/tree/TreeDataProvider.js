const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from './ModuleDefinition';
 * @import { TreeDataProvider } from 'vscode';
 * @import { GlobalPath } from '../common/path/Path';
 * @import ModuleCache from './ModuleCache';
 * @class @implements {TreeDataProvider<ModuleDefinition>}
 */
class ImportTreeDataProvider {
    /** @param {ModuleCache} cache */
    constructor(cache) {
        this.cache = cache;
        /** @type {ModuleDefinition[]} */
        this.tree = [];

        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
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
                newItem.label = label;
                this._onDidChangeTreeData.fire();
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
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(/**@type {ModuleDefinition} */ element) {
        return {
            label: element.label ?? element.name.valueOf(),
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
        return element.imports;
    }
}


module.exports = ImportTreeDataProvider;