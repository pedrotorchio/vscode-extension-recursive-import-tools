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
module.exports.searchImportsRecursively = async (dataProvider, workspaceMap) => {
    const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile({
        absolutePath: Global(editor.document.uri.fsPath), 
        treeDataProvider: dataProvider, 
        workspaceMap
    }));
    const moduleTree = await Promise.all(entriesAsync);
    dataProvider.setTree(moduleTree);
}