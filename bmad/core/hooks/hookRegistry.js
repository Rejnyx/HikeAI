/**
 * Hook Registry
 * Spravuje registraci, ukládání a získávání hooks
 *
 * @module hookRegistry
 */

// In-memory registry pro hooks
let hooksRegistry = new Map();

// Cache pro hooks config
let configCache = null;
let configCacheTime = null;
const CACHE_TTL = 60000; // 60 sekund

/**
 * Registruje hook
 *
 * @param {Object} hook - Hook k registraci
 * @param {string} hook.name - Unikátní název hooku
 * @param {string} hook.type - Typ hooku
 * @param {Function} hook.execute - Funkce k provedení
 * @param {boolean} [hook.enabled=true] - Jestli je hook aktivní
 * @param {number} [hook.priority=50] - Priorita (vyšší = dřív)
 * @param {Object} [hook.config] - Konfigurace hooku
 * @returns {boolean} True pokud úspěšně registrován
 */
export function registerHook(hook) {
  // Validate hook
  if (!hook || !hook.name) {
    throw new Error('Hook must have a name');
  }

  if (!hook.type) {
    throw new Error(`Hook "${hook.name}" must have a type`);
  }

  if (typeof hook.execute !== 'function') {
    throw new Error(`Hook "${hook.name}" must have an execute function`);
  }

  // Check if already registered
  if (hooksRegistry.has(hook.name)) {
    console.warn(`⚠️  Hook "${hook.name}" is already registered. Overwriting...`);
  }

  // Set defaults
  const hookToRegister = {
    enabled: true,
    priority: 50,
    config: {},
    ...hook
  };

  // Register
  hooksRegistry.set(hook.name, hookToRegister);
  console.log(`✅ Hook registered: "${hook.name}" (type: ${hook.type}, priority: ${hookToRegister.priority})`);

  return true;
}

/**
 * Odregistruje hook
 *
 * @param {string} hookName - Název hooku k odregistrování
 * @returns {boolean} True pokud byl hook odregistrován
 */
export function unregisterHook(hookName) {
  if (!hooksRegistry.has(hookName)) {
    console.warn(`⚠️  Hook "${hookName}" not found in registry`);
    return false;
  }

  hooksRegistry.delete(hookName);
  console.log(`🗑️  Hook unregistered: "${hookName}"`);
  return true;
}

/**
 * Získá všechny registrované hooks
 *
 * @returns {Array<Object>} Pole všech hooks
 */
export function getAllHooks() {
  return Array.from(hooksRegistry.values());
}

/**
 * Získá hooks podle typu
 *
 * @param {string} hookType - Typ hooku
 * @returns {Array<Object>} Pole hooks daného typu
 */
export function getHooksByType(hookType) {
  return Array.from(hooksRegistry.values())
    .filter(hook => hook.type === hookType);
}

/**
 * Získá hook podle jména
 *
 * @param {string} hookName - Název hooku
 * @returns {Object|null} Hook nebo null
 */
export function getHookByName(hookName) {
  return hooksRegistry.get(hookName) || null;
}

/**
 * Vyčistí celý registry
 *
 * @returns {number} Počet odstraněných hooks
 */
export function clearRegistry() {
  const count = hooksRegistry.size;
  hooksRegistry.clear();
  configCache = null;
  configCacheTime = null;
  console.log(`🧹 Hook registry cleared (${count} hooks removed)`);
  return count;
}

/**
 * Získá počet registrovaných hooks
 *
 * @returns {number} Počet hooks
 */
export function getRegistrySize() {
  return hooksRegistry.size;
}

/**
 * Načte hooks z konfiguračního souboru
 *
 * @param {string} configPath - Cesta ke config souboru
 * @param {Function} loadConfigFn - Funkce pro načtení config (např. readFileSync + YAML.parse)
 * @returns {Promise<number>} Počet načtených hooks
 */
export async function loadHooksFromConfig(configPath, loadConfigFn) {
  try {
    // Check cache
    const now = Date.now();
    if (configCache && configCacheTime && (now - configCacheTime < CACHE_TTL)) {
      console.log('📦 Using cached hooks config');
      return configCache.hooks ? configCache.hooks.length : 0;
    }

    // Load config
    console.log(`📄 Loading hooks config from: ${configPath}`);
    const config = await loadConfigFn(configPath);

    // Cache config
    configCache = config;
    configCacheTime = now;

    // Validate config
    if (!config || !config.hooks || !Array.isArray(config.hooks)) {
      throw new Error('Invalid hooks config: must have "hooks" array');
    }

    // Register hooks from config
    let registered = 0;
    for (const hookConfig of config.hooks) {
      // Skip disabled hooks
      if (hookConfig.enabled === false) {
        console.log(`⏭️  Skipping disabled hook: "${hookConfig.name}"`);
        continue;
      }

      // Create hook with inline execute function
      // Note: In real implementation, you'd import actual hook implementations
      const hook = {
        name: hookConfig.name,
        type: hookConfig.type,
        enabled: hookConfig.enabled !== false,
        priority: hookConfig.priority || 50,
        config: hookConfig.config || {},
        // Placeholder execute function - replace with actual implementation
        execute: async (context, stepData) => {
          return {
            status: 'continue',
            message: `Hook "${hookConfig.name}" executed (placeholder)`,
            modifications: {},
            telemetry: {}
          };
        }
      };

      registerHook(hook);
      registered++;
    }

    console.log(`✅ Loaded ${registered} hooks from config`);
    return registered;

  } catch (error) {
    console.error(`❌ Failed to load hooks config: ${error.message}`);
    throw error;
  }
}

/**
 * Vypíše debug info o registry
 */
export function debugRegistry() {
  console.log('\n=== HOOK REGISTRY DEBUG ===');
  console.log(`Total hooks: ${hooksRegistry.size}`);

  if (hooksRegistry.size === 0) {
    console.log('(Registry is empty)');
    return;
  }

  // Group by type
  const byType = new Map();
  for (const hook of hooksRegistry.values()) {
    if (!byType.has(hook.type)) {
      byType.set(hook.type, []);
    }
    byType.get(hook.type).push(hook);
  }

  for (const [type, hooks] of byType.entries()) {
    console.log(`\n📌 ${type} (${hooks.length} hooks):`);
    hooks
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .forEach(hook => {
        const status = hook.enabled !== false ? '✅' : '❌';
        console.log(`  ${status} ${hook.name} (priority: ${hook.priority || 50})`);
      });
  }

  console.log('\n=========================\n');
}

/**
 * Exportuje registry jako JSON
 *
 * @returns {Object} Serialized registry
 */
export function exportRegistry() {
  const hooks = Array.from(hooksRegistry.values()).map(hook => ({
    name: hook.name,
    type: hook.type,
    enabled: hook.enabled,
    priority: hook.priority,
    config: hook.config
    // Note: execute function is not serializable
  }));

  return {
    hooks,
    count: hooks.length,
    timestamp: new Date().toISOString()
  };
}

export default {
  registerHook,
  unregisterHook,
  getAllHooks,
  getHooksByType,
  getHookByName,
  clearRegistry,
  getRegistrySize,
  loadHooksFromConfig,
  debugRegistry,
  exportRegistry
};
