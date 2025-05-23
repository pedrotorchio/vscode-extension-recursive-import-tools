/**
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import { WorkspacePackageMap } from '../common/package/utils';
 */
const vscode = require('vscode');
const { Global } = require('../common/path/Path');
const { parseFile } = require('../tree/file-parser');

/**
 * Builds the file tree and updates the data provider.
 * @typedef {{
 *     treeDataProvider: ImportTreeDataProvider,
 *     workspacePackageMap: WorkspacePackageMap
 * }} Args
 */
module.exports = class GenerateDownstreamTreeCommand {
    /** @param {Args} args */
    constructor({ treeDataProvider: treeDataProvider, workspacePackageMap }) {
        this.treeDataProvider = treeDataProvider;
        this.workspacePackageMap = workspacePackageMap;
    }
    async execute() {
        const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile({
            absolutePath: Global(editor.document.uri.fsPath),
            treeDataProvider: this.treeDataProvider,
            workspacePackageMap: this.workspacePackageMap
        }));
        const moduleTree = await Promise.all(entriesAsync);
        this.treeDataProvider.setTree(moduleTree);
    }
} 