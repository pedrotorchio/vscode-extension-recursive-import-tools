const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { TypescriptParser } = require('typescript-parser');
const { concat, Global, join, Relative, resolve } = require('./Path');

/**
 * @typedef {Object} ModuleDefinition
 * @property {string} name
 * @property {string} path
 * @property {string} extension
 * @property {string | null} contents
 * @property {ModuleDefinition[]} imports
 */

const typescriptParser = new TypescriptParser();
const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Activates the extension.
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const disposable = vscode.commands.registerCommand('dependency-tree-searcher.searchOpenFileTree', async () => {
        const entriesAsync = vscode.window.visibleTextEditors.map(editor => parseFile(Global(editor.document.uri.fsPath)));
        const moduleTree = await Promise.all(entriesAsync);
        console.log(JSON.stringify(moduleTree, null, 2));
        debugger;
    });

    context.subscriptions.push(disposable);
}

/**
 * Checks if a file exists asynchronously.
 * @param {GlobalPath} basePath
 * @param {string} [optionalPath]
 * @returns {Promise<boolean>}
 */
function existsASync(basePath, optionalPath) {
    const file = vscode.Uri.file(optionalPath ? join(basePath, optionalPath) : basePath);
    return vscode.workspace.fs.stat(file).then(
        a => a.type === vscode.FileType.File,
        e => (e.code === 'FileNotFound' ? false : Promise.reject(e))
    );
}

/**
 * Finds the first existing file in a list of paths.
 * @param {GlobalPath[]} paths
 * @returns {Promise<string | null>}
 */
async function findExistingFileInList(paths) {
    for (const path of paths) {
        if (await existsASync(path)) {
            return path;
        }
    }
    return null;
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

/**
 * Ensures a filepath has an extension.
 * @param {GlobalPath} importedPath
 * @returns {Promise<GlobalPath | null>}
 */
async function ensureFilepathWithExtension(importedPath) {
    if (path.extname(importedPath)) { return importedPath; }

    const completeFileName = await attachPotentialBarrelAndFileExtension(importedPath);
    if (!completeFileName) { return null; }

    const workspacePath = Global(vscode.workspace.workspaceFolders[0].uri.fsPath);
    const absolutePath = join(workspacePath, completeFileName);
    return absolutePath;
}

/**
 * Parses a file and returns its module definition.
 * @param {GlobalPath} globalAbsolutePath
 * @returns {Promise<ModuleDefinition>}
 */
async function parseFile(globalAbsolutePath) {
    const basePath = Global(path.dirname(globalAbsolutePath));
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

        const extension = path.extname(completeAbsolutePath);
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
        extension: path.extname(globalAbsolutePath),
        imports: moduleDefinitions.filter(Boolean)
    };
}

/**
 * Deactivates the extension.
 */
function deactivate() { }

module.exports = {
    activate,
    deactivate
};