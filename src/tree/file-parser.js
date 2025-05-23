const { findNearestPackageJson } = require('../common/package/utils');
/**
 * @import { GlobalPath, LibraryImportPath, RelativeImportPath } from '../common/path/Path';
 * @import { ModuleDefinition } from '../tree/ModuleDefinition';
 * @import { WorkspacePackageMap } from '../common/package/utils';
 * @import ImportTreeDataProvider from '../tree/TreeDataProvider';
 */
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const { TypescriptParser } = require('typescript-parser');

const { Global, Relative, Library } = require('../common/path/Path');
const { concat, resolve, join, ext } = require('../common/path/utils');

const typescriptParser = new TypescriptParser();
const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const context = {
    recursingCount: 0
};
/**
 * @param {{
 *  absolutePath: GlobalPath,
 *  workspacePackageMap: WorkspacePackageMap
 *  treeDataProvider: ImportTreeDataProvider
 *  depth?: number
 * }} args
 * @returns {Promise<ModuleDefinition | null>}
 */
async function parseFile({ absolutePath, workspacePackageMap, treeDataProvider, depth = 0 }) {
    if (treeDataProvider.getItem(absolutePath)) {
        console.log(`File already parsed: ${absolutePath}`);
        return treeDataProvider.getItem(absolutePath);
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
    /**
     * Converts an import to a module definition.
     * @param {{ libraryName: string }} library
     * @returns {Promise<ModuleDefinition> | null}
     */
    const resolveModuleDefinition = (library) => {
        const completeAbsolutePath = resolveModuleCompletePath(library);
        if (!completeAbsolutePath) return null;

        try {
            return parseFile({ absolutePath: completeAbsolutePath, workspacePackageMap, treeDataProvider, depth: depth && depth - 1 });
        } catch (e) {
            console.error(`Error parsing file ${completeAbsolutePath}: ${e.message}`);
            return null;
        }
    };

    const resolveImportName = () => {
        const { path: packagePath, package: packageJson } = findNearestPackageJson(absolutePath);
        const relativePath = Relative(path.relative(path.dirname(packagePath.valueOf()), absolutePath.valueOf()));
        const itemName = join(Library(packageJson.name), relativePath);
        return itemName;
    }
    const shouldResolveImports = depth > 0;

    // Register tree item first to avoid infinite recursion
    const treeItem = treeDataProvider.createItem(absolutePath);
    Object.assign(treeItem, {
        name: resolveImportName(),
        path: absolutePath,
        contents: contentsString,
        extension: ext(absolutePath),
        imports: [],
        hasResolvedImports: shouldResolveImports,
    });

    treeDataProvider.setItem(treeItem);

    // Then recursively visit nested imports
    /** @type {ModuleDefinition[] | GlobalPath[]} */
    const resolvedImportsUnfiltered = shouldResolveImports
        ? await Promise.all(parsedFile.imports.map(resolveModuleDefinition))
        : parsedFile.imports.map(resolveModuleCompletePath);

    const imports = resolvedImportsUnfiltered.filter(Boolean);

    // Update tree item with the resolved imports
    Object.assign(treeItem, { imports });
    treeDataProvider.setItem(treeItem);

    return treeItem;
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

module.exports = {
    parseFile,
};