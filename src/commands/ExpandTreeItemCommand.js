/**
 * @import { TreeViewExpansionEvent } from "vscode";
 * @import { ModuleDefinition } from "../tree/ModuleDefinition";
 * @import { WorkspacePackageMap } from "../common/package/utils";
 * @import ImportTreeDataProvider from "../tree/TreeDataProvider";
 * 
 * @typedef {{
 *    workspacePackageMap: WorkspacePackageMap,
 *    treeDataProvider: ImportTreeDataProvider
 * }} Args
 */
const { parseFile } = require("../tree/file-parser");
module.exports = class ExpandTreeItemCommand {
    /** @param {Args} args */
    constructor({ workspacePackageMap, treeDataProvider }) {
        this.workspacePackageMap = workspacePackageMap;
        this.treeDataProvider = treeDataProvider;
    }

    /** @param { TreeViewExpansionEvent<ModuleDefinition> } event */
    execute({ element }) {
        // TODO: parse element with depth = 1
        parseFile({
            absolutePath: element.path,
            treeDataProvider: this.treeDataProvider,
            workspacePackageMap: this.workspacePackageMap,
            depth: 1
        }).then(() => this.treeDataProvider.updateTree());
    }
}