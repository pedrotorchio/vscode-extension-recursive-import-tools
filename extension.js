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
const ExpandTreeItemCommand = require('./src/commands/ExpandTreeItemCommand');

/**
 * @import { ModuleDefinition } from './src/tree/ModuleDefinition';
 * @import { TreeView, ExtensionContext } from 'vscode';
 */

/**
 * @param {ExtensionContext} context
 */
function activate(context) {
	const rootPath = Global(vscode.workspace.workspaceFolders[0].uri.fsPath);
	const workspacePackageMap = getWorkspaceMap(rootPath);

	const moduleCache = new ModuleCache();
	const labels = new Labels(context);
	const treeDataProvider = new ImportTreeDataProvider({ cache: moduleCache, labels });
	const treeView = vscode.window.createTreeView('imports_tree', {
		treeDataProvider: treeDataProvider,
		showCollapseAll: true,
	});

	const openFileCommand = new OpenFileCommand();
	const editItemLabelCommand = new EditItemLabelCommand(labels);
	const downstreamTreeRefreshCommand = new DownstreamTreeRefreshCommand(treeDataProvider, workspacePackageMap);
	const expandTreeItemCommand = new ExpandTreeItemCommand({ workspacePackageMap, treeDataProvider });

	const searchDisposable = vscode.commands.registerCommand('recursive-import-tools.update-tree', () => downstreamTreeRefreshCommand.execute());
	const onClickDisposable = vscode.commands.registerCommand('recursive-import-tools.import-tree-open-file', (module) => openFileCommand.execute(module));
	const editLabelDisposable = vscode.commands.registerCommand('recursive-import-tools.edit-item-label', (module) => editItemLabelCommand.execute(module));

	const onDidExpandElementDisposable = treeView.onDidExpandElement(el => expandTreeItemCommand.execute(el));

	labels.reload();
	context.subscriptions.push(searchDisposable, onClickDisposable, editLabelDisposable, onDidExpandElementDisposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
