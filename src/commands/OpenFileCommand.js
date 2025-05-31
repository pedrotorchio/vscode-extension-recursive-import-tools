const vscode = require('vscode');
/**
 * @import { ModuleDefinition } from '../tree/types';
 * @import { OutputChannel } from 'vscode';
 */


module.exports = class OpenFileCommand {
    /**
     * @param {{ logger: OutputChannel }} args
     */
    constructor({ logger }) {
        this.logger = logger;
    }
    /**
     * @param {ModuleDefinition} moduleDefinition 
     */
    async execute(moduleDefinition) {
        const doc = await vscode.workspace.openTextDocument(moduleDefinition.path.valueOf());

        return vscode.window.showTextDocument(doc, {
            preview: false
        }).then(() => { }, err => {
            this.logger.appendLine(`Failed to open document: "${err.message}" for module: "${moduleDefinition.path}"`);
            return Promise.reject(err);
        });
    }
};
