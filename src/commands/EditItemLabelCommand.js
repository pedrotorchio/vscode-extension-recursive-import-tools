const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from '../tree/ModuleDefinition';
 */

module.exports = class EditItemLabelCommand {
    /**
     * @param {ModuleDefinition} moduleDefinition 
     */
    async execute(moduleDefinition) {
        const newLabel = await vscode.window.showInputBox();
        moduleDefinition.setLabel(newLabel);
    }
}