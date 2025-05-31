const vscode = require('vscode');

const { getWorkspaceMap } = require('./src/common/package/utils');
const ImportTreeDataProvider = require('./src/tree/TreeDataProvider');
const { Global } = require('./src/common/path/Path');
const Labels = require('./src/common/path/Labels');
const ModuleCache = require('./src/tree/ModuleCache');

const GenerateDownstreamTreeCommand = require('./src/commands/GenerateDownstreamTreeCommand');
const OpenFileCommand = require('./src/commands/OpenFileCommand');
const EditItemLabelCommand = require('./src/commands/EditItemLabelCommand');
const ExpandTreeItemCommand = require('./src/commands/ExpandTreeItemCommand');

/**
 * @import { ExtensionContext } from 'vscode';
 */

/**
 * @param {ExtensionContext} context
 */
function activate(context) {
	const rootPath = Global(vscode.workspace.workspaceFolders[0].uri.fsPath);
	const outputChannel = vscode.window.createOutputChannel('Recursive Import Tools');
	const workspacePackageMap = getWorkspaceMap(rootPath);

	const moduleCache = new ModuleCache();
	const labels = new Labels(context);
	const treeDataProvider = new ImportTreeDataProvider({ cache: moduleCache, labels });
	const treeView = vscode.window.createTreeView('imports_tree', {
		treeDataProvider: treeDataProvider,
		showCollapseAll: true,
	});

	const openFileCommand = new OpenFileCommand({ logger: outputChannel });
	const editItemLabelCommand = new EditItemLabelCommand({ labels, treeDataProvider, moduleCache, logger: outputChannel });
	const downstreamTreeRefreshCommand = new GenerateDownstreamTreeCommand({ treeDataProvider, workspacePackageMap, moduleCache, logger: outputChannel });
	const expandTreeItemCommand = new ExpandTreeItemCommand({ workspacePackageMap, treeDataProvider, moduleCache, logger: outputChannel });

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
