const path = require('path');
const findPackageJson = require('find-package-json');
const { sync: globResolve } = require('fast-glob');
const { Global } = require('../path/Path');
const { join } = require('../path/utils');
/**
 * @import { PackageJSON } from 'find-package-json';
 * @import { GlobalPath } from '../path/Path';
 * @typedef {Map<string, GlobalPath>} WorkspacePackageMap
 */

/**
 * @param {GlobalPath} globalPath
 * @returns {{
 *  path: GlobalPath,
 *  package: PackageJSON
 * }}
 */
function findNearestPackageJson(globalPath) {
    const packageJsonRaw = findPackageJson(globalPath.valueOf()).next();
    const { value: packageJson, filename: packagePath } = packageJsonRaw;

    return {
        path: Global(packagePath),
        package: packageJson,
    }
}

/**
 * Finds the nearest package.json file to param `startPath` which contains a workspaces key and 
 * returns a map of all packages in the workspace.
 * @param {GlobalPath} startPath
 * @returns {WorkspacePackageMap | null} workspacePackageMap
 */
function getWorkspacePackageMap(startPath) {
    // iterate package json files until finding one with "workspaces" key
    let packageWithWorkspaces = null;
    for (const packageJson of findPackageJson(startPath.valueOf())) {
        if (packageJson.workspaces) {
            packageWithWorkspaces = packageJson;
            break;
        }
    }
    if (!packageWithWorkspaces) return null;
    const workspaceRoot = Global(path.dirname(packageWithWorkspaces.__path));
    /** @type Map<string, GlobalPath> */
    const workspacePackageMap = new Map();
    const workspacesArray = /** @type {string[]} */ (packageWithWorkspaces.workspaces);
    workspacesArray.forEach(workspaceGlob => {
        const packagesDir = join(workspaceRoot, workspaceGlob, 'package.json').valueOf();
        const packages = globResolve(packagesDir, {
            absolute: true,
        });
        packages.forEach(packagePath => {
            const packageJson = require(packagePath);
            workspacePackageMap.set(packageJson.name, Global(path.dirname(packagePath)));
        });
    });
    return workspacePackageMap;
}

module.exports = {
    findNearestPackageJson,
    getWorkspaceMap: getWorkspacePackageMap
}
