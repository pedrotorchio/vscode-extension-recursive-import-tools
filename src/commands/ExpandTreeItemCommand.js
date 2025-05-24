/**
 * @import { TreeViewExpansionEvent } from "vscode";
 * @import { GlobalPath } from "../common/path/Path";
 * @import { WorkspacePackageMap } from "../common/package/utils";
 * @import ImportTreeDataProvider from "../tree/TreeDataProvider";
 * @import ModuleCache from "../tree/ModuleCache";
 * 
 * @typedef {{
 *    workspacePackageMap: WorkspacePackageMap,
 *    treeDataProvider: ImportTreeDataProvider
 *    moduleCache: ModuleCache
 * }} Args
 */
const { parseFiles } = require("../tree/file-parser");
module.exports = class ExpandTreeItemCommand {
    /** @param {Args} args */
    constructor({ workspacePackageMap, treeDataProvider, moduleCache }) {
        this.workspacePackageMap = workspacePackageMap;
        this.treeDataProvider = treeDataProvider;
        this.moduleCache = moduleCache;
    }

    /** @param { TreeViewExpansionEvent<GlobalPath> } event */
    async execute({ element }) {
        const moduleDefinition = this.moduleCache.get(element);
        await parseFiles(moduleDefinition.imports, {
            moduleCache: this.moduleCache,
            workspacePackageMap: this.workspacePackageMap,
        });
        this.treeDataProvider.updateTree();
    }
}