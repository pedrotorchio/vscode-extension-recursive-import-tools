/**
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import { WorkspacePackageMap } from '../common/package/utils';
 */
const vscode = require('vscode');
const { Global } = require('../common/path/Path');
const { parseFile } = require('../tree/file-parser');

/**
 * Builds the file tree and updates the data provider.
 * @param {ImportTreeDataProvider} dataProvider
 * @param {WorkspacePackageMap} workspacePackageMap
 * @returns {Promise<void>}
 */
module.exports = class DownstreamTreeRefreshCommand {
    constructor(dataProvider, workspacePackageMap) {
        /** @type {ImportTreeDataProvider} */
        this.dataProvider = dataProvider;
        /** @type {WorkspacePackageMap} */
        this.workspacePackageMap = workspacePackageMap;
    }
    async execute() {
        const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile({
            absolutePath: Global(editor.document.uri.fsPath),
            treeDataProvider: this.dataProvider,
            workspacePackageMap: this.workspacePackageMap
        }));
        const moduleTree = await Promise.all(entriesAsync);
        this.dataProvider.setTree(moduleTree);
    }
} 