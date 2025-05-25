/**
 * @import { TreeViewExpansionEvent } from "vscode";
 * @import { WorkspacePackageMap } from "../common/package/utils";
 * @import ImportTreeDataProvider from "../tree/TreeDataProvider";
 * @import ModuleCache from "../tree/ModuleCache";
 * @import { ImportDefinition } from "../tree/types";
 * 
 * @typedef {{
 *    workspacePackageMap: WorkspacePackageMap,
 *    treeDataProvider: ImportTreeDataProvider
 *    moduleCache: ModuleCache
 * }} Args
 */
const { parseImports } = require("../tree/file-parser");
module.exports = class ExpandTreeItemCommand {
    /** @param {Args} args */
    constructor({ workspacePackageMap, treeDataProvider, moduleCache }) {
        this.workspacePackageMap = workspacePackageMap;
        this.treeDataProvider = treeDataProvider;
        this.moduleCache = moduleCache;
    }

    /** @param { TreeViewExpansionEvent<ImportDefinition> } event */
    async execute({ element }) {
        const moduleDefinition = this.moduleCache.get(element.path);
        await parseImports(moduleDefinition.imports, {
            moduleCache: this.moduleCache,
            workspacePackageMap: this.workspacePackageMap,
        });
        this.treeDataProvider.updateTree();
    }
}