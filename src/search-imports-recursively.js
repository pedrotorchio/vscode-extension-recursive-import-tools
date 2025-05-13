const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { TypescriptParser } = require('typescript-parser');
const { concat, Global, join, Relative, resolve } = require('./Path');
const { findExistingFileInList } = require('./utils');

/**
 * @import { GlobalPath } from './Path';
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
    console.log(JSON.stringify(moduleTree, null, 2));
    debugger;
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
    const importToModuleDefinition = async ({ libraryName }) => {
        const isRelativePath = libraryName.startsWith('.');
        if (!isRelativePath) { return null; }

        const relativeImportPath = Relative(libraryName);
        const absoluteImportPath = resolve(basePath, relativeImportPath);
        const completeAbsolutePath = await ensureFilepathWithExtension(absoluteImportPath).catch(e => {
            console.error(`Error resolving import path ${relativeImportPath}: ${e.message}`);
            return null;
        });
        if (completeAbsolutePath === null) { return null; }

        const extension = path.extname(completeAbsolutePath.valueOf());
        const isValidExtension = supportedExtensions.some(ext => ext === extension);
        if (!isValidExtension) { return null; }

        const fileExists = fs.existsSync(completeAbsolutePath);
        if (!fileExists) {
            console.error(`File does not exist: ${completeAbsolutePath}`);
            return null;
        }

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
        extension: path.extname(globalAbsolutePath.valueOf()),
        imports: moduleDefinitions.filter(Boolean)
    };
}

/**
 * Ensures a filepath has an extension.
 * @param {GlobalPath} importedPath
 * @returns {Promise<GlobalPath | null>}
 */
async function ensureFilepathWithExtension(importedPath) {
    if (path.extname(importedPath.valueOf())) { return importedPath; }

    const completeFileName = await attachPotentialBarrelAndFileExtension(importedPath);
    if (!completeFileName) { return null; }

    const workspacePath = Global(vscode.workspace.workspaceFolders[0].uri.fsPath);
    const absolutePath = join(workspacePath, completeFileName);
    return absolutePath;
}

/**
 * Attaches potential barrel and file extension to an imported path.
 * @param {GlobalPath} importedPath
 * @returns {Promise<GlobalPath | null>}
 */
async function attachPotentialBarrelAndFileExtension(importedPath) {
    const checkExistsAsync = (pather) =>
        findExistingFileInList(supportedExtensions.map(pather));

    const foundExtension = await checkExistsAsync(ext => concat(importedPath, ext));
    if (foundExtension) { return concat(importedPath, foundExtension); }

    const foundBarrelExtension = await checkExistsAsync(ext => concat(importedPath, '/index', ext));
    if (foundBarrelExtension) { return join(importedPath, 'index' + foundBarrelExtension); }

    return null;
}
