/**
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import { WorkspaceMap } from '../package/utils';
 */
const vscode = require('vscode');
const { Global } = require('../path/Path');
const { parseFile } = require('../tree/file-parser');

/**
 * Builds the file tree and updates the data provider.
 * @param {ImportTreeDataProvider} dataProvider
 * @param {WorkspaceMap} workspaceMap
 * @returns {Promise<void>}
 */
module.exports = class DownstreamTreeRefreshCommand {
    constructor(dataProvider, workspaceMap) {
        /** @type {ImportTreeDataProvider} */
        this.dataProvider = dataProvider;
        /** @type {WorkspaceMap} */
        this.workspaceMap = workspaceMap;
    }
    async execute() {
        const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile({
            absolutePath: Global(editor.document.uri.fsPath),
            treeDataProvider: this.dataProvider,
            workspaceMap: this.workspaceMap
        }));
        const moduleTree = await Promise.all(entriesAsync);
        this.dataProvider.setTree(moduleTree);
    }
} 