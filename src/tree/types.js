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
 *      type?: 'library' | 'local',
 *      specifiers: string[],
 *      defaultAlias: string | null,
 *      namespaceAlias: string | null,
 * }} ImportDefinition
 * 
 * @typedef {{
 *      isDefault: boolean,
 *      isNamespace: boolean,
 *      name: string,
 * }} ImportedVariable
 */