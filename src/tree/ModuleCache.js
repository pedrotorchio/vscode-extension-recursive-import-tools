/**
 * @import { ModuleDefinition } from './types';
 * @import { GlobalPath } from '../common/path/Path';
 * Cache for module definitions. Has methods get, set and clear
 */
module.exports = class ModuleCache {
    constructor() {
        /** @type {Map<string, ModuleDefinition>} */
        this.cache = new Map();
    }
    /**
     * @param {GlobalPath} path
     * @returns {ModuleDefinition|null}
     */
    get(path) {
        return this.cache.get(path.valueOf()) ?? null;
    }
    /**
     * @param {ModuleDefinition} module
     * @returns {ModuleDefinition}
     */
    set(module) {
        this.cache.set(module.path.valueOf(), module);
        return module;
    }
    /**
     * Clears the cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * @param {GlobalPath} path
     * @returns {boolean}
     */
    has(path) {
        return this.cache.has(path.valueOf());
    }
}