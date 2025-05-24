/**
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import { WorkspacePackageMap } from '../common/package/utils';
 * @import ModuleCache from '../tree/ModuleCache';
 * @import { GlobalPath } from '../common/path/Path';
 */
const vscode = require('vscode');
const { Global } = require('../common/path/Path');
const { parseFile } = require('../tree/file-parser');

/**
 * Builds the file tree and updates the data provider.
 * @typedef {{
 *     moduleCache: ModuleCache,
 *     treeDataProvider: ImportTreeDataProvider,
 *     workspacePackageMap: WorkspacePackageMap
 * }} Args
 */
module.exports = class GenerateDownstreamTreeCommand {
    /** @param {Args} args */
    constructor({ treeDataProvider, workspacePackageMap, moduleCache }) {
        this.treeDataProvider = treeDataProvider;
        this.workspacePackageMap = workspacePackageMap;
        this.moduleCache = moduleCache;
    }
    async execute() {
        const entryPaths = vscode.window.visibleTextEditors.map(editor => Global(editor.document.uri.fsPath));
        const parseEntryPath = (/**@type {GlobalPath}*/absolutePath) => parseFile(absolutePath, {
            moduleCache: this.moduleCache,
            workspacePackageMap: this.workspacePackageMap
        });
        // Parse all entry paths in parallel, adding them to the module cache
        await Promise.all(entryPaths.map(parseEntryPath));
        // update the tree data provider with the new roots
        this.treeDataProvider.setRoots(entryPaths);
    }
} 