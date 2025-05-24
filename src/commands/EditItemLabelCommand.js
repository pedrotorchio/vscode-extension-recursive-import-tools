const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from '../tree/types';
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import Labels from '../common/path/Labels';
*/

/**
 * @typedef {{
 *      labels: Labels
 *      treeDataProvider: ImportTreeDataProvider
 * }} Args
 */
module.exports = class EditItemLabelCommand {
    /**
     * @param {Args} args
     */
    constructor({ labels, treeDataProvider }) {
        this.labels = labels;
        this.treeDataProvider = treeDataProvider;
    }

    /**
     * @param {ModuleDefinition} moduleDefinition
     */
    async execute(moduleDefinition) {
        const newLabel = await vscode.window.showInputBox();
        await this.labels.set(moduleDefinition.name, newLabel);
        this.treeDataProvider.updateTree();
        vscode.window.showInformationMessage(`Label for ${moduleDefinition.name} updated to ${newLabel}`);
    }
}