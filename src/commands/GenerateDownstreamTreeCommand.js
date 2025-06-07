/**
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import { WorkspacePackageMap } from '../common/package/utils';
 * @import ModuleCache from '../tree/ModuleCache';
 * @import { GlobalPath } from '../common/path/Path';
 * @import {OutputChannel} from 'vscode';
 */
const vscode = require('vscode');
const { Global } = require('../common/path/Path');
const { parseFile } = require('../tree/file-parser');

/**
 * Builds the file tree and updates the data provider.
 * @typedef {{
 *     moduleCache: ModuleCache,
 *     treeDataProvider: ImportTreeDataProvider,
 *     workspacePackageMap: WorkspacePackageMap,
 *     logger: OutputChannel
 * }} Args
 */
module.exports = class GenerateDownstreamTreeCommand {
    /** @param {Args} args */
    constructor({ treeDataProvider, workspacePackageMap, moduleCache, logger }) {
        this.treeDataProvider = treeDataProvider;
        this.workspacePackageMap = workspacePackageMap;
        this.moduleCache = moduleCache;
        this.logger = logger;
    }
    async execute() {
        const entryPaths = vscode.window.visibleTextEditors
            .map(editor => editor.document.uri)
            .filter(uri => uri.scheme === 'file')
            .map(uri => Global(uri.fsPath));

        const parseEntryPath = (/**@type {GlobalPath}*/absolutePath) => parseFile(absolutePath, {
            moduleCache: this.moduleCache,
            workspacePackageMap: this.workspacePackageMap,
        });
        // Parse all entry paths in parallel, adding them to the module cache
        return Promise.all(entryPaths.map(parseEntryPath))
            .then(() => {
                // update the tree data provider with the new roots
                this.treeDataProvider.setRoots(entryPaths);
            }).catch(err => {
                console.error('Error parsing entry paths:', err);
                vscode.window.showErrorMessage('Failed to parse entry paths. Check the output channel for details.');
                this.logger.appendLine(`Failed to parse entry paths: "${err.message}"`);
                this.treeDataProvider.setRoots([]);
            });
    }
} 