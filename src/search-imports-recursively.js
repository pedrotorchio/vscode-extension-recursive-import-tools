const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { TypescriptParser } = require('typescript-parser');

const { Global, Relative } = require('./path/Path');
const { concat, resolve, join, ext } = require('./path/utils');

/**
 * @import { GlobalPath } from './path/Path';
 * 
 * @typedef {{
 *      name: string,
 *      path: string,
 *      contents: string,
 *      extension: string,
 *      imports: ModuleDefinition[]
 * }} ModuleDefinition;
 */

const typescriptParser = new TypescriptParser();
const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

module.exports.searchImportsRecursively = async () => {
    const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile(Global(editor.document.uri.fsPath)));
    const moduleTree = await Promise.all(entriesAsync);
    console.dir(moduleTree);
};

/**
 * Parses a file and returns its module definition.
 * @param {GlobalPath} globalAbsolutePath
 * @returns {Promise<ModuleDefinition>}
 */
async function parseFile(globalAbsolutePath) {
    const basePath = Global(path.dirname(globalAbsolutePath.valueOf()));
    const contentsBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(globalAbsolutePath));
    const contentsString = Buffer.from(contentsBytes).toString('utf8');
    const parsedFile = await typescriptParser.parseSource(contentsString);

    /**
     * Converts an import to a module definition.
     * @param {{ libraryName: string }} param0
     * @returns {Promise<ModuleDefinition | null>}
     */
    const importToModuleDefinition = ({ libraryName }) => {
        const isRelativePath = libraryName.startsWith('.');
        if (!isRelativePath) { return null; }

        const relativeImportPath = Relative(libraryName);
        const absoluteImportPath = resolve(basePath, relativeImportPath);
        const completeAbsolutePath = ensureFilepathWithExtension(absoluteImportPath);
        if (!completeAbsolutePath) return null;

        try {
            return parseFile(completeAbsolutePath);
        } catch (e) {
            console.error(`Error parsing file ${completeAbsolutePath}: ${e.message}`);
            return null;
        }
    };

    const moduleDefinitionPromises = parsedFile.imports.map(importToModuleDefinition);
    const moduleDefinitions = await Promise.all(moduleDefinitionPromises);

    return {
        name: globalAbsolutePath,
        path: globalAbsolutePath,
        contents: contentsString,
        extension: ext(globalAbsolutePath),
        imports: moduleDefinitions.filter(Boolean)
    };
}

/**
 * Ensures a filepath has an extension.
 * @param {GlobalPath} importedPath
 * @returns {GlobalPath | null}
 */
function ensureFilepathWithExtension(importedPath) {
    const importedPathExtension = ext(importedPath);
    if (supportedExtensions.some(ext => ext === importedPathExtension)) return importedPath;

    const maybeFoundPathWithExtension = forEachExtensionCheckExists(ext => concat(importedPath, ext));
    if (maybeFoundPathWithExtension) return maybeFoundPathWithExtension;

    const maybeFoundBarrelFile = forEachExtensionCheckExists(ext => join(importedPath, 'index' + ext));
    if (maybeFoundBarrelFile) return maybeFoundBarrelFile;

    return null;
}

/**
 * @typedef {function(string): GlobalPath} Pather
 * @param {Pather} pather 
 * @returns { GlobalPath | null }
 */
const forEachExtensionCheckExists = (pather) => {
    /** @type {GlobalPath | null} */
    let foundFile = null;
    supportedExtensions.forEach(ext => {
        const completePath = pather(ext);
        const fileExists = fs.existsSync(completePath.valueOf());
        if (fileExists) foundFile = completePath;
    });
    return foundFile;
}

