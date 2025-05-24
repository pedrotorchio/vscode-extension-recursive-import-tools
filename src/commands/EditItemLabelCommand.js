const vscode = require('vscode');
/**
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import Labels from '../common/path/Labels';
 * @import { GlobalPath } from '../common/path/Path';
 * @import ModuleCache from '../tree/ModuleCache';
*/

/**
 * @typedef {{
 *      labels: Labels
 *      treeDataProvider: ImportTreeDataProvider
 *      moduleCache: ModuleCache
 * }} Args
 */
module.exports = class EditItemLabelCommand {
    /**
     * @param {Args} args
     */
    constructor({ labels, treeDataProvider, moduleCache }) {
        this.labels = labels;
        this.treeDataProvider = treeDataProvider;
        this.moduleCache = moduleCache;
    }

    /**
     * @param {GlobalPath} globalPath
     */
    async execute(globalPath) {
        const newLabel = await vscode.window.showInputBox();
        const moduleDefinition = this.moduleCache.get(globalPath);
        // uses name instead of path to decouple label persistance from the file system (location of workspace)
        await this.labels.set(moduleDefinition.name, newLabel);
        this.treeDataProvider.updateTree();
        vscode.window.showInformationMessage(`Label for ${moduleDefinition.name} updated to ${newLabel}`);
    }
}