const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from '../tree/types';
 */
module.exports = class OpenFileCommand {
    /**
     * @param {ModuleDefinition} moduleDefinition 
     */
    async execute(moduleDefinition) {
        const doc = await vscode.workspace.openTextDocument(moduleDefinition.path.valueOf());
        await vscode.window.showTextDocument(doc, {
            preview: false
        });
    }
};
