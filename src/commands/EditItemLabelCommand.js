const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from '../tree/ModuleDefinition';
 * @import Labels from '../common/path/Labels';
*/
module.exports = class EditItemLabelCommand {
    /**
     * @param {Labels} labels 
     */
    constructor(labels) {
        /** @type {Labels} */
        this.labels = labels;
    }

    /**
     * @param {ModuleDefinition} moduleDefinition
     */
    async execute(moduleDefinition) {
        const newLabel = await vscode.window.showInputBox();
        moduleDefinition.setLabel(newLabel);

        await this.labels.set(moduleDefinition.name, newLabel);
        vscode.window.showInformationMessage(`Label for ${moduleDefinition.name} updated to ${newLabel}`);
    }
}