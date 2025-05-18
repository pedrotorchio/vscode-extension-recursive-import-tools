const { findNearestPackageJson } = require('../package/utils');
/**
 * @import { GlobalPath, LibraryImportPath, RelativeImportPath } from '../path/Path';
 * @import { ModuleDefinition } from '../tree/ModuleDefinition';
 * @import { WorkspaceMap } from '../package/utils';
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 */
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { TypescriptParser } = require('typescript-parser');

const { Global, Relative, Library } = require('../path/Path');
const { concat, resolve, join, ext } = require('../path/utils');

const typescriptParser = new TypescriptParser();
const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const context = {
    recursingCount: 0
};
/**
 * Parses a file and returns its module definition.
 * @param {{
 *  absolutePath: GlobalPath,
 *  workspaceMap: WorkspaceMap
 *  treeDataProvider: ImportTreeDataProvider
 * }} args
 * @returns {Promise<ModuleDefinition | null>}
 */
async function parseFile({ absolutePath,  workspaceMap, treeDataProvider }) {
    if (treeDataProvider.getItem(absolutePath)) {
        console.log(`File already parsed: ${absolutePath}`);
        return treeDataProvider.getItem(absolutePath);
    }
    
    context.recursingCount++;
    console.log(`Parsing file: ${absolutePath} (${context.recursingCount})`);
    if (context.recursingCount > 200) console.warn(`Recursive parsing passed 200 iterations.`);
    if (context.recursingCount > 1000) throw new Error(`Recursive parsing passed 1000 iterations.`);
    
    const treeItem = treeDataProvider.createItem(absolutePath);

    const basePath = Global(path.dirname(absolutePath.valueOf()));
    const contentsBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(absolutePath));
    const contentsString = Buffer.from(contentsBytes).toString('utf8');
    const parsedFile = await typescriptParser.parseSource(contentsString);

    /**
     * Converts an import to a module definition.
     * @param {{ libraryName: string }} param0
     * @returns {Promise<ModuleDefinition | null>}
     */
    const importToModuleDefinition = ({ libraryName }) => {
        if (path.isAbsolute(libraryName)) return null;
        const isRelativePath = libraryName.startsWith('.');
        const workspacePackageAbsolutePath = findWorkspacePackage(libraryName, workspaceMap);
        if (!isRelativePath && !workspacePackageAbsolutePath) return null;

        const absoluteImportPath = isRelativePath 
            ? resolve(basePath, libraryName)
            : workspacePackageAbsolutePath;

        const completeAbsolutePath = ensureFilepathWithExtension(absoluteImportPath);
        if (!completeAbsolutePath) return null;

        try {
            return parseFile({ absolutePath: completeAbsolutePath, workspaceMap, treeDataProvider});
        } catch (e) {
            console.error(`Error parsing file ${completeAbsolutePath}: ${e.message}`);
            return null;
        }
    };

    const moduleDefinitionPromises = parsedFile.imports.map(importToModuleDefinition);
    const moduleDefinitionsUnfiltered = await Promise.all(moduleDefinitionPromises);
    const moduleDefinitions = moduleDefinitionsUnfiltered.filter(Boolean);
    const { path: packagePath, package: packageJson } = findNearestPackageJson(absolutePath);
    const relativePath = Relative(path.relative(path.dirname(packagePath.valueOf()), absolutePath.valueOf()));
    const itemName = join(Library(packageJson.name), relativePath);

    Object.assign(treeItem,{
        name: itemName,
        path: absolutePath,
        contents: contentsString,
        extension: ext(absolutePath),
        imports: moduleDefinitions
    });

    treeDataProvider.setItem(treeItem);
    return treeItem;
}
/**
 *
 * @param {string} importedPath
 * @param {Readonly<WorkspaceMap>} workspaceMap
 * @returns {GlobalPath | null}
 */
const findWorkspacePackage = (importedPath, workspaceMap) => {
        const packageNameSeparated = importedPath.split('/');
        const packageNameWithoutScope = packageNameSeparated[0];
        if (workspaceMap.has(packageNameWithoutScope)) {
            const packageGlobalRoot = workspaceMap.get(packageNameWithoutScope);
            const internalPath = Relative(packageNameSeparated.slice(1).join('/'));
            const importedGlobalPath = resolve(packageGlobalRoot, internalPath); 
            return importedGlobalPath;
        }

        const packageNameWithScope = packageNameSeparated.slice(0, 2).join('/');
        if (workspaceMap.has(packageNameWithScope)) {
            const packageGlobalRoot = workspaceMap.get(packageNameWithScope);
            const internalPath = Relative(packageNameSeparated.slice(2).join('/'));
            const importedGlobalPath = resolve(packageGlobalRoot, internalPath); 
            return importedGlobalPath;
        }
        return null;
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

module.exports = {
    parseFile,
};