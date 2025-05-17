/**
 * @import { Disposable } from 'vscode';
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import { WorkspaceMap } from '../package/utils';
 */
const vscode = require('vscode');
const { Global } = require('../path/Path');
const { parseFile } = require('../tree/file-parser');
/**
 * @param {ImportTreeDataProvider} dataProvider
 * @param {WorkspaceMap} workspaceMap
 * @returns {Disposable & { execute: () => Promise<void> }}
 */
module.exports.searchImportsRecursively = (dataProvider, workspaceMap) => {

    const buildFileTree = buildFileTreeAndUpdateDataProvider(dataProvider, workspaceMap);

    const onChangeOpenFilesListener = vscode.window.onDidChangeVisibleTextEditors(buildFileTree);
    buildFileTree();
    
    return {
        dispose: () => onChangeOpenFilesListener.dispose(),
        execute: buildFileTree,
    };
};

/**
 * Builds the file tree and updates the data provider.
 * @param {ImportTreeDataProvider} dataProvider
 * @param {WorkspaceMap} workspaceMap
 * @returns {() => Promise<void>}
 */
const buildFileTreeAndUpdateDataProvider = (dataProvider, workspaceMap) => async () => {
    const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile({
        absolutePath: Global(editor.document.uri.fsPath), 
        treeDataProvider: dataProvider, 
        workspaceMap
    }));
    const moduleTree = await Promise.all(entriesAsync);
    dataProvider.setTree(moduleTree);
}