const vscode = require('vscode');
const path = require('path');
const { Global } = require('../common/path/Path');
/**
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 * @import Labels from '../common/path/Labels';
 * @import { GlobalPath, RelativeImportPath } from '../common/path/Path';
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
        const moduleDefinition = this.moduleCache.get(globalPath);
        const currentLabel = this.labels.get(moduleDefinition.name) || moduleDefinition.name;
        const newLabel = await vscode.window.showInputBox({
            placeHolder: moduleDefinition.name,
            prompt: `What would you like to rename '${moduleDefinition.name}'? Leave empty to reset to default.`,
            ignoreFocusOut: false,
            value: currentLabel,
            valueSelection: [0, currentLabel.length],
        });
        // uses name instead of path to decouple label persistance from the file system (location of workspace)
        await this.renameTab(globalPath, newLabel || null)
            .catch((error) => {
                vscode.window.showErrorMessage(`Failed to update tab label: ${error.message}`);
            });

        if (!newLabel) this.labels.clear(moduleDefinition.name);
        else await this.labels.set(moduleDefinition.name, newLabel);

        const message = newLabel
            ? `File "${moduleDefinition.name}" label set to "${newLabel}"`
            : `File "${moduleDefinition.name}" label reset to default`;
        vscode.window.showInformationMessage(message);
        this.treeDataProvider.updateTree();

    }

    /** 
     * VSCode patterns configuration is used to rename tabs.
     * This method uses the workspace configuration api to update the patterns with the absolute path of the renamed file
     * TODO: Consider using path relative to workspace root instead of absolute path  
     * @param {GlobalPath} globalPath 
     * @param {string | null} renameTo
     * @return {Promise<{ previousLabel: string, customLabelPattern: string }>}
     **/
    async renameTab(globalPath, renameTo) {
        const pathUri = vscode.Uri.file(globalPath.valueOf());
        if (pathUri.scheme !== 'file') {
            throw new Error(`Cannot rename tab for non-file: ${pathUri.toString()}`);
        }
        const configuration = vscode.workspace.getConfiguration();
        // Ensure the custom labels feature is enabled
        configuration.update(CONFIG_KEY_ENABLED, true, vscode.ConfigurationTarget.Workspace);
        /** @type {Record<string, string>} */
        const currentPatterns = configuration.get(CONFIG_KEY_PATTERNS) ?? {};
        const filename = path.basename(globalPath.valueOf());
        // For windows, absolute paths start with a drive letter, e.g. C:, E:, D:
        //      but the patterns configuration expects absolute paths to start 
        //      with a '/'
        const customLabelPattern = this.getRelativePatternString(globalPath);
        const currentLabel = currentPatterns[customLabelPattern] ?? filename;

        if (!renameTo) delete currentPatterns[customLabelPattern];
        else currentPatterns[customLabelPattern] = renameTo;

        return configuration.update(CONFIG_KEY_PATTERNS, currentPatterns, vscode.ConfigurationTarget.Workspace)
            .then(() => Promise.resolve({ previousLabel: currentLabel, customLabelPattern }), err => Promise.reject(err));
    }

    /** 
     * @param {GlobalPath} globalPath 
     * @return {string}
     **/
    getRelativePatternString(globalPath) {
        const rootPathString = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!rootPathString) throw new Error("No workspace folder found. Cannot determine relative path.");

        const rootGlobalPath = Global(rootPathString); // Global constructor ensures separator consistency (using forward slashes /)
        const relativePath = globalPath
            .replace(rootGlobalPath.valueOf(), ''); // Remove workspace root from path

        return relativePath.startsWith("/")
            ? `*${relativePath}`
            : `*/${relativePath}`;
    }
}

const CONFIG_KEY_PATTERNS = 'workbench.editor.customLabels.patterns';
const CONFIG_KEY_ENABLED = 'workbench.editor.customLabels.enabled';