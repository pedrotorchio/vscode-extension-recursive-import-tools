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
	const updateImportTree = () => searchImportsRecursively(importTreeDataProvider, workspacePackages);
	
	const treeViewDisposable = (function setupTreeView() {
		const treeViewDisposable = vscode.window.registerTreeDataProvider('imports-tree', importTreeDataProvider);

		const onChangeOpenFilesListener = vscode.window.onDidChangeVisibleTextEditors(updateImportTree);
		const searchDisposable = vscode.commands.registerCommand('import-recursive-search.search', updateImportTree);
		const onClickDisposable = vscode.commands.registerCommand('import-recursive-search.import-tree-open-file', openFile);
	
		return {
			dispose: () => {
				searchDisposable.dispose();
				onChangeOpenFilesListener.dispose();
				treeViewDisposable.dispose();
				onClickDisposable.dispose();
			}
		}
	})();
	
	context.subscriptions.push(treeViewDisposable);

	updateImportTree();
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
