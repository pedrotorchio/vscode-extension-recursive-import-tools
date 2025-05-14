const vscode = require('vscode');
const { TypescriptParser } = require('typescript-parser');

const { Global } = require('../path/Path');
const { parseFile } = require('../tree/file-parser');
/**
 * 
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 */
module.exports.searchImportsRecursively = (/** @type {ImportTreeDataProvider} */ dataProvider) => async () => {
    const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile(Global(editor.document.uri.fsPath)));
    const moduleTree = await Promise.all(entriesAsync);
    dataProvider.setTree(moduleTree);
    console.dir(moduleTree);
};
