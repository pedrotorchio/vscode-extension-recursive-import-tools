const vscode = require('vscode');
const { TypescriptParser } = require('typescript-parser');

const { Global } = require('../path/Path');
const { parseFile } = require('../tree/file-parser');
/**
 * @import { Disposable } from 'vscode';
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @param ImportTreeDataProvider dataProvider
 * @returns {Disposable & { execute: () => Promise<void> }}
 */
module.exports.searchImportsRecursively = (/** @type {ImportTreeDataProvider} */ dataProvider) => {

    const buildFileTree = buildFileTreeAndUpdateDataProvider(dataProvider);
    const onChangeOpenFilesListener = vscode.window.onDidChangeVisibleTextEditors(buildFileTree);
    
    return {
        dispose: () => onChangeOpenFilesListener.dispose(),
        execute: buildFileTree,
    };
};

const buildFileTreeAndUpdateDataProvider = (/** @type {ImportTreeDataProvider} */ dataProvider) => async () => {
    const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile(Global(editor.document.uri.fsPath)));
    const moduleTree = await Promise.all(entriesAsync);
    dataProvider.setTree(moduleTree);
}