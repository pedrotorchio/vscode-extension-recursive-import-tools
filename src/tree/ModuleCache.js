/**
 * @import { ModuleDefinition } from './ModuleDefinition';
 * @import { GlobalPath } from '../common/path/Path';
 */
/**
 * Cache for module definitions. Has methods get, set and clear
 */
class ModuleCache {
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
     * @param {GlobalPath} path
     * @param {ModuleDefinition} module
     */
    set(path, module) {
        this.cache.set(path.valueOf(), module);
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
    
module.exports = ModuleCache;