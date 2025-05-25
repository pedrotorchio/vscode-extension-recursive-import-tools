/**
 * @import { GlobalPath, LibraryImportPath } from '../common/path/Path.js';
 */

/** 
 * @typedef {{
 *      name: LibraryImportPath,
 *      path: GlobalPath,
 *      contents: string,
 *      extension: string,
 *      imports: ImportDefinition[],
 * }} ModuleDefinition
 * 
 * @typedef {{
 *      path: GlobalPath,
 *      specifiers: string[],
 *      defaultAlias: string | null,
 * }} ImportDefinition
 */