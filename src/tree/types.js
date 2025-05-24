/**
 * @import { GlobalPath, LibraryImportPath } from '../common/path/Path.js';
 */

/** 
 * @typedef {{
 *      name: LibraryImportPath,
 *      path: GlobalPath,
 *      contents: string,
 *      extension: string,
 *      imports: GlobalPath[],
 *      setLabel: (label: string) => void,
 * }} ModuleDefinition
 */

/**
 * @typedef {{
 *     path: GlobalPath,
 *     imports: PathTreeNode[]
 * }} PathTreeNode
 */