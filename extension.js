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
	
	const treeViewModule = (function setupTreeView() {
		
		const treeViewDisposable = vscode.window.registerTreeDataProvider('imports_tree', importTreeDataProvider);
		const searchDisposable = vscode.commands.registerCommand('recursive-import-tools.update-tree', () => searchImportsRecursively(importTreeDataProvider, workspacePackages));
		const onClickDisposable = vscode.commands.registerCommand('recursive-import-tools.import-tree-open-file', openFile);
		const editLabelDisposable = vscode.commands.registerCommand('recursive-import-tools.edit-item-label', (moduleDefinition) => vscode.window.showInputBox().then(moduleDefinition.setLabel));
		return {
			dispose: () => {
				searchDisposable.dispose();
				treeViewDisposable.dispose();
				onClickDisposable.dispose();
				editLabelDisposable.dispose();
			}
		}
	})();
	
	context.subscriptions.push(treeViewModule);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
