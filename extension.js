const { getWorkspaceMap } = require('./src/package/utils');
const ImportTreeDataProvider = require('./src/tree/TreeDataProvider');
const { Global } = require('./src/path/Path');

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { searchImportsRecursively } = require('./src/commands/search-imports-recursively');
const { openFile } = require('./src/commands/open-file');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {	
	const rootPath = Global(vscode.workspace.workspaceFolders[0].uri.fsPath);
	const workspacePackages = getWorkspaceMap(rootPath);

	const importTreeDataProvider = new ImportTreeDataProvider();
	const importsTree = searchImportsRecursively(importTreeDataProvider, workspacePackages);
	vscode.window.registerTreeDataProvider('imports-tree', importTreeDataProvider);
	
	const searchDisposable = vscode.commands.registerCommand('import-recursive-search.search', importsTree.execute);
	const onClickDisposable = vscode.commands.registerCommand('import-recursive-search.import-tree-open-file', openFile);
	context.subscriptions.push(searchDisposable, importsTree, onClickDisposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
