const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from '../tree/ModuleDefinition';
 * @param {ModuleDefinition} moduleDefinition 
 */
module.exports.openFile = async (moduleDefinition) => {
    const doc = await vscode.workspace.openTextDocument(moduleDefinition.path.valueOf());
    await vscode.window.showTextDocument(doc);
}