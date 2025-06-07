
const vscode = require('vscode');
/**
 * @import { TreeDataProvider } from 'vscode';
 * @import { GlobalPath } from '../common/path/Path';
 * @import ModuleCache from './ModuleCache';
 * @import Labels from '../common/path/Labels';
 * @import { ImportDefinition, ImportedVariable, ModuleDefinition } from './types';
 * @class @implements {TreeDataProvider<ImportDefinition | ImportedVariable>}
 */
class ImportTreeDataProvider {
    static icons = {
        downstream_dependency: new vscode.ThemeIcon('debug-step-out'),
        upstream_dependency: new vscode.ThemeIcon('debug-step-into'),
        leaf_dependency: new vscode.ThemeIcon('white-space'),
        library: new vscode.ThemeIcon('library'),
        local: new vscode.ThemeIcon('search-details'),
        namedVariable: new vscode.ThemeIcon('bracket'),
        defaultVariable: new vscode.ThemeIcon('preserve-case')
    }
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
        this._onDidChangeTreeData.fire(null);
    }

    /**
     * @param {GlobalPath[]} roots
     */
    setRoots(roots) {
        this.roots = roots;
        this.updateTree();
    }

    /**
     * Get the tree item for a given import definition or imported variable.
     * @param {ImportDefinition | ImportedVariable} importDefinition
     * @returns {vscode.TreeItem}
     */
    getTreeItem(importDefinition) {
        if (isImportedVariable(importDefinition)) return {
            label: getLabel(importDefinition, this.labels),
            collapsibleState: 0,
            contextValue: 'variable',
            iconPath: importDefinition.isDefault || importDefinition.isNamespace
                ? ImportTreeDataProvider.icons.defaultVariable
                : ImportTreeDataProvider.icons.namedVariable,
        }

        const path = importDefinition.path;
        const element = this.cache.get(path);
        if (!element) throw new Error(`Element not found in cache for path: ${path}`);

        const imports = element.imports;
        const hasChildren = imports.length > 0;
        return {
            label: getLabel(element, this.labels),
            collapsibleState: hasChildren ? 1 : 0,
            command: {
                command: 'recursive-import-tools.import-tree-open-file',
                title: 'Open file',
                arguments: [element]
            },
            iconPath: getIcon(importDefinition),
            contextValue: 'module'
        };
    }

    getChildren(/**@type {ImportDefinition | ImportedVariable}*/importDefinition) {
        if (isImportedVariable(importDefinition)) return [];

        const path = importDefinition?.path;
        if (!path) {
            const specifiers = [];
            const defaultAlias = null;
            return this.roots.map(rootPath => /**@type {ImportDefinition}*/({ path: rootPath, specifiers, defaultAlias }));
        }
        const element = this.cache.get(path);
        if (!element) throw new Error(`Element not found in cache for path: ${path}`);

        const imports = element.imports;
        // Only shows tree children if all of them are already cached
        const areAllImportsCached = imports.every(importDefinition => this.cache.has(importDefinition.path));
        if (!areAllImportsCached) return [];
        // variables exported by this module and used by its parent are listed as its children
        const aliasImports = [];
        if (importDefinition.namespaceAlias) {
            aliasImports.push({
                name: importDefinition.namespaceAlias,
                isDefault: false,
                isNamespace: true
            });
        }
        if (importDefinition.defaultAlias) {
            aliasImports.push({
                name: importDefinition.defaultAlias,
                isDefault: true,
                isNamespace: false
            });
        }
        const namedVariableItems = importDefinition.specifiers.map(specifier => ({
            name: specifier,
            isDefault: false,
            isNamespace: false
        }));

        return [...aliasImports, ...namedVariableItems, ...imports]
    }
}

/**
 * 
 * @param {ImportDefinition | ImportedVariable} def 
 */
const getIcon = (def) => {
    if (isImportedVariable(def)) {
        return def.isDefault
            ? ImportTreeDataProvider.icons.defaultVariable
            : ImportTreeDataProvider.icons.namedVariable;
    }
    if (def.type === 'library') return ImportTreeDataProvider.icons.library;
    return '';
}

/**
 * @param {ModuleDefinition | ImportedVariable} def
 * @param {Labels} labels
 * @return {string}
 */
const getLabel = (def, labels) => {
    if (isImportedVariable(def)) {
        const name = def.name;
        if (def.isDefault) return `default ${name}`;
        if (def.isNamespace) return `* as ${name}`;
        return name;
    }

    return labels.get(def.name) ?? def.name.valueOf();
}

/**
 * @param {ImportedVariable} importDefinition
 * @returns {'default' | 'named' | 'namespace'}
 */
const getVariableType = (importDefinition) => {
    if (importDefinition.isDefault) return 'default';
    if (importDefinition.isNamespace) return 'namespace';
    return 'named';
}
/**
 * 
 * @param {ImportDefinition | ImportedVariable | ModuleDefinition} item 
 * @returns {item is ImportedVariable}
 */
const isImportedVariable = (item) => {
    return item && typeof item === 'object' && 'name' in item && 'isDefault' in item;
};
module.exports = ImportTreeDataProvider;