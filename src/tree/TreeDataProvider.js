
/**
 * @import { ModuleDefinition } from './ModuleDefinition';
 * @import { TreeDataProvider } from 'vscode';
 * @class @implements {TreeDataProvider<ModuleDefinition>}
 */
class ImportTreeDataProvider {
    constructor(/**@type {ModuleDefinition[]}*/tree) {
        /** @type {ModuleDefinition[]} */
        this.tree = tree;
    }
    getTreeItem(/**@type {ModuleDefinition} */ element) {
        return {
            label: element.name,
            collapsibleState: element.imports.length > 0 ? 1 : 0,
            command: {
                command: 'extension.openModule',
                title: 'Open Module',
                arguments: [element],
            },
        };
    }
    getChildren(/**@type {ModuleDefinition}*/element) {
        if (!element) return this.tree;
        return element.imports;
    }
}

module.exports = ImportTreeDataProvider;