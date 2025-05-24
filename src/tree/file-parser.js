/**
 * @import { GlobalPath } from '../common/path/Path';
 * @import { ModuleDefinition, PathTreeNode } from './types';
 * @import { WorkspacePackageMap } from '../common/package/utils';
 * @import ModuleCache from '../tree/ModuleCache';
*/

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { TypescriptParser } = require('typescript-parser');

const { findNearestPackageJson } = require('../common/package/utils');
const { Global, Relative, Library } = require('../common/path/Path');
const { concat, resolve, join, ext } = require('../common/path/utils');

const typescriptParser = new TypescriptParser();
const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const context = {
    recursingCount: 0
};
/**
 * @typedef {{
 *  workspacePackageMap: WorkspacePackageMap
 *  moduleCache: ModuleCache
 * }} Args
 * Parses a tree of files starting from the given absolute path and resolves absolute paths nested within
 * the file, returning a PathTreeNode object. The function will recursively parse all imports down to 'depth' and as a side effect, will store
 * all the ModuleDefinition objects in the ModuleCache
 * @param {GlobalPath} absolutePath
 * @param {Args} args
 * @returns {Promise<ModuleDefinition | null>}
 */
async function parseFile(absolutePath, { workspacePackageMap, moduleCache }) {
    if (moduleCache.has(absolutePath)) {
        console.log(`Module already cached: ${absolutePath}`);
        return moduleCache.get(absolutePath);
    }
    context.recursingCount++;
    console.log(`Parsing file: ${absolutePath} (${context.recursingCount})`);

    const basePath = Global(path.dirname(absolutePath.valueOf()));
    const contentsBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(absolutePath));
    const contentsString = Buffer.from(contentsBytes).toString('utf8');
    const parsedFile = await typescriptParser.parseSource(contentsString);

    /**
     * @param {{
     *  libraryName: string,
     * }} args
     * @returns {GlobalPath | null}
     */
    const resolveModuleCompletePath = ({ libraryName }) => {
        if (path.isAbsolute(libraryName)) return null;
        const isRelativePath = libraryName.startsWith('.');
        const workspacePackageAbsolutePath = findWorkspacePackage(libraryName, workspacePackageMap);
        if (!isRelativePath && !workspacePackageAbsolutePath) return null;

        const absoluteImportPath = isRelativePath
            ? resolve(basePath, libraryName)
            : workspacePackageAbsolutePath;

        const completeAbsolutePath = ensureFilepathWithExtension(absoluteImportPath);
        if (!completeAbsolutePath) return null;

        return completeAbsolutePath;
    }

    const resolveImportName = () => {
        const { path: packagePath, package: packageJson } = findNearestPackageJson(absolutePath);
        const relativePath = Relative(path.relative(path.dirname(packagePath.valueOf()), absolutePath.valueOf()));
        const itemName = join(Library(packageJson.name), relativePath);
        return itemName;
    }

    // Then recursively visit nested imports
    const importAbsolutePaths = parsedFile.imports.map(resolveModuleCompletePath).filter(Boolean);
    // Register module and return it
    return moduleCache.set({
        path: absolutePath,
        name: resolveImportName(),
        contents: contentsString,
        extension: ext(absolutePath),
        imports: importAbsolutePaths,
    });
}

/**
 *
 * @param {string} importedPath
 * @param {Readonly<WorkspacePackageMap>} workspacePackageMap
 * @returns {GlobalPath | null}
 */
const findWorkspacePackage = (importedPath, workspacePackageMap) => {
    const packageNameSeparated = importedPath.split('/');
    const packageNameWithoutScope = packageNameSeparated[0];
    if (workspacePackageMap.has(packageNameWithoutScope)) {
        const packageGlobalRoot = workspacePackageMap.get(packageNameWithoutScope);
        const internalPath = Relative(packageNameSeparated.slice(1).join('/'));
        const importedGlobalPath = resolve(packageGlobalRoot, internalPath);
        return importedGlobalPath;
    }

    const packageNameWithScope = packageNameSeparated.slice(0, 2).join('/');
    if (workspacePackageMap.has(packageNameWithScope)) {
        const packageGlobalRoot = workspacePackageMap.get(packageNameWithScope);
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
const parseFiles = (/**@type {GlobalPath[]}*/ filePaths, /**@type {Args}*/args) => {
    return Promise.all(filePaths.map(path => parseFile(path, args)));
}
module.exports = {
    parseFile,
    parseFiles,
};