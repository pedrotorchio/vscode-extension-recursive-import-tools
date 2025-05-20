const { getWorkspaceMap } = require('./src/common/package/utils');
const ImportTreeDataProvider = require('./src/tree/TreeDataProvider');
const { Global } = require('./src/common/path/Path');
const Labels = require('./src/common/path/Labels');
const ModuleCache = require('./src/tree/ModuleCache');


// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const DownstreamTreeRefreshCommand = require('./src/commands/DownstreamTreeRefreshCommand');
const OpenFileCommand = require('./src/commands/OpenFileCommand');
const EditItemLabelCommand = require('./src/commands/EditItemLabelCommand');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const rootPath = Global(vscode.workspace.workspaceFolders[0].uri.fsPath);
	const workspacePackages = getWorkspaceMap(rootPath);

	const moduleCache = new ModuleCache();
	const labels = new Labels(context);
	const importTreeDataProvider = new ImportTreeDataProvider(moduleCache);

	const treeViewModule = (function setupTreeView() {

		const openFileCommand = new OpenFileCommand();
		const editItemLabelCommand = new EditItemLabelCommand(labels);
		const downstreamTreeRefreshCommand = new DownstreamTreeRefreshCommand(importTreeDataProvider, workspacePackages);

		const treeViewDisposable = vscode.window.registerTreeDataProvider('imports_tree', importTreeDataProvider);
		const searchDisposable = vscode.commands.registerCommand('recursive-import-tools.update-tree', () => downstreamTreeRefreshCommand.execute());
		const onClickDisposable = vscode.commands.registerCommand('recursive-import-tools.import-tree-open-file', (module) => openFileCommand.execute(module));
		const editLabelDisposable = vscode.commands.registerCommand('recursive-import-tools.edit-item-label', (module) => editItemLabelCommand.execute(module));

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
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
