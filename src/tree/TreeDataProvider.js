const vscode = require('vscode');
const ModuleCache = require('./ModuleCache');
/**
 * @import { ModuleDefinition } from './ModuleDefinition';
 * @import { TreeDataProvider } from 'vscode';
 * @import { GlobalPath } from '../path/Path';
 * @class @implements {TreeDataProvider<ModuleDefinition>}
 */
class ImportTreeDataProvider {
    constructor() {
        /** @type {ModuleDefinition[]} */
        this.tree = [];
        this.cache = new ModuleCache();

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

        /**@type {ModuleDefinition}*/
        const newItem = {
            path,
            name: '<undefined>',
            imports: [],
            contents: '<undefined>',
            extension: '<undefined>',
            label: null,
            setLabel: (label) => {
                newItem.label = label;
                this._onDidChangeTreeData.fire();
            },
        }
        this.cache.set(path, newItem);
        return newItem;
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