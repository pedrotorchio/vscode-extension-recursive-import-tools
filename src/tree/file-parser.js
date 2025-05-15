/**
 * @import { GlobalPath } from '../path/Path';
 * @import { ModuleDefinition } from '../tree/ModuleDefinition';
 */
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { TypescriptParser } = require('typescript-parser');
const findPackageJson = require('find-package-json');

const { Global, Relative } = require('../path/Path');
const { concat, resolve, join, ext } = require('../path/utils');

const typescriptParser = new TypescriptParser();
const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Parses a file and returns its module definition.
 * @param {import("../path/Path").GlobalPath} globalAbsolutePath
 * @returns {Promise<import("./ModuleDefinition").ModuleDefinition>}
 */
async function parseFile(globalAbsolutePath) {
    const basePath = Global(path.dirname(globalAbsolutePath.valueOf()));
    const contentsBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(globalAbsolutePath));
    const contentsString = Buffer.from(contentsBytes).toString('utf8');
    const parsedFile = await typescriptParser.parseSource(contentsString);

    /**
     * Converts an import to a module definition.
     * @param {{ libraryName: string }} param0
     * @returns {Promise<import("./ModuleDefinition").ModuleDefinition | null>}
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

    const { value: packageJson, filename: packagePath} = findPackageJson(globalAbsolutePath.valueOf()).next();
    const relativePath = Relative(path.relative(path.dirname(packagePath), globalAbsolutePath.valueOf()));
    const itemName = join(packageJson.name, relativePath);

    return {
        name: itemName,
        path: globalAbsolutePath,
        contents: contentsString,
        extension: ext(globalAbsolutePath),
        imports: moduleDefinitions.filter(Boolean)
    };
}

/**
 * Ensures a filepath has an extension.
 * @param {import("../path/Path").GlobalPath} importedPath
 * @returns {import("../path/Path").GlobalPath | null}
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
 * @typedef {function(string): import("../path/Path").GlobalPath} Pather
 * @param {Pather} pather 
 * @returns { import("../path/Path").GlobalPath | null }
 */
const forEachExtensionCheckExists = (pather) => {
    /** @type {import("../path/Path").GlobalPath | null} */
    let foundFile = null;
    supportedExtensions.forEach(ext => {
        const completePath = pather(ext);
        const fileExists = fs.existsSync(completePath.valueOf());
        if (fileExists) foundFile = completePath;
    });
    return foundFile;
}

module.exports = {
    parseFile,
};