/**
 * @import { GlobalPath, LibraryImportPath } from '../common/path/Path.js';
 * @typedef {{
 *      name: LibraryImportPath,
 *      path: GlobalPath,
 *      contents: string,
 *      extension: string,
 *      setLabel: (label: string) => void,
 * }} _CommonModuleDefinitionFields
 * @typedef {_CommonModuleDefinitionFields & {
 *      imports: ModuleDefinition[],
 *      hasResolvedImports: true
 * }} ModuleDefinitionWithResolvedModules
 * @typedef {_CommonModuleDefinitionFields & {
 *     imports: GlobalPath[],
 *     hasResolvedImports: false
 * }} ModuleDefinitionWithUnresolvedModules
 *
 * @typedef{ ModuleDefinitionWithResolvedModules | ModuleDefinitionWithUnresolvedModules } ModuleDefinition
 */