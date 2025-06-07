/**
 * @import { TreeViewExpansionEvent } from "vscode";
 * @import { WorkspacePackageMap } from "../common/package/utils";
 * @import ImportTreeDataProvider from "../tree/TreeDataProvider";
 * @import ModuleCache from "../tree/ModuleCache";
 * @import { ImportDefinition } from "../tree/types";
 * @import { OutputChannel } from "vscode";
 * 
 * @typedef {{
 *    workspacePackageMap: WorkspacePackageMap,
 *    treeDataProvider: ImportTreeDataProvider
 *    moduleCache: ModuleCache
 *    logger: OutputChannel
 * }} Args
 */
const vscode = require("vscode");
const { parseImports } = require("../tree/file-parser");
module.exports = class ExpandTreeItemCommand {
    /** @param {Args} args */
    constructor({ workspacePackageMap, treeDataProvider, moduleCache, logger }) {
        this.workspacePackageMap = workspacePackageMap;
        this.treeDataProvider = treeDataProvider;
        this.moduleCache = moduleCache;
        this.logger = logger;
    }

    /** @param { TreeViewExpansionEvent<ImportDefinition> } event */
    async execute({ element }) {
        const moduleDefinition = this.moduleCache.get(element.path);
        if (!moduleDefinition) {
            const message = `Module definition not found for "${element.path.valueOf()}" when expanding tree item.`;
            vscode.window.showErrorMessage(message);
            this.logger.appendLine(message);
            return;
        }
        await parseImports(moduleDefinition.imports, {
            moduleCache: this.moduleCache,
            workspacePackageMap: this.workspacePackageMap,
        }).catch(err => {
            console.error(`Error parsing imports for ${element.path.valueOf()}:`, err);
            this.logger.appendLine(`Error parsing imports for "${element.path.valueOf()}": "${err.message}"`);
        });
        this.treeDataProvider.updateTree();
    }
}