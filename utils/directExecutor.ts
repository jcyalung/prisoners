/**
 * Hybrid execution: Validate/test in worker once, then execute directly.
 * 
 * Strategy:
 * 1. When code is first seen, validate and test it in a worker (proves it's safe)
 * 2. Compile the function and cache it
 * 3. Execute the cached function directly in main thread (fast)
 * 
 * This gives us worker isolation for validation but direct execution for performance.
 */

import { validateCode } from './code-security';
import { testCompilationInWorker } from './strategyWorkerManager';

// Cache for compiled strategy functions (keyed by code + COOPERATE + DEFECT)
const functionCache = new Map<string, (opponent_history: string[]) => string>();

// Track which codes have been validated in a worker
const validatedCodes = new Set<string>();

/**
 * Creates a cache key for the function cache
 */
function createCacheKey(code: string, COOPERATE: string, DEFECT: string): string {
    return code.trim() + '|' + COOPERATE + '|' + DEFECT;
}

/**
 * Validates and compiles code in a worker once, then caches for direct execution.
 * This ensures code is safe before we trust it to run in the main thread.
 * 
 * @param code - User-provided strategy code
 * @param COOPERATE - COOPERATE constant value
 * @param DEFECT - DEFECT constant value
 * @returns Promise that resolves when code is validated and cached
 * @throws Error if validation/compilation fails
 */
export async function validateAndCacheFunction(
    code: string,
    COOPERATE: string,
    DEFECT: string
): Promise<void> {
    // Validate code first
    const validation = validateCode(code);
    if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid code');
    }

    const trimmedCode = code.trim();
    const cacheKey = createCacheKey(trimmedCode, COOPERATE, DEFECT);

    // If already validated and cached, skip
    if (validatedCodes.has(cacheKey) && functionCache.has(cacheKey)) {
        return;
    }

    // Test compilation in worker (proves code is safe)
    await testCompilationInWorker(trimmedCode, COOPERATE, DEFECT);

    // Now compile and cache for direct execution
    const iifeCode = '(function() {' +
        '"use strict";' +
        'const COOPERATE = ' + JSON.stringify(COOPERATE) + ';' +
        'const DEFECT = ' + JSON.stringify(DEFECT) + ';' +
        'const fetch = undefined;' +
        'const XMLHttpRequest = undefined;' +
        'const window = undefined;' +
        'const document = undefined;' +
        'const location = undefined;' +
        'return function(opponent_history) {' +
        'if (!Array.isArray(opponent_history)) {' +
        'throw new Error("opponent_history must be an array");' +
        '}' +
        trimmedCode +
        '};' +
        '})();';

    const funcFactory = new Function('return ' + iifeCode);
    const strategyFunction = funcFactory();

    if (typeof strategyFunction !== 'function') {
        throw new Error('Code must return a function');
    }

    // Cache the validated and compiled function
    functionCache.set(cacheKey, strategyFunction);
    validatedCodes.add(cacheKey);
}

/**
 * Executes user code directly (after it's been validated in a worker).
 * Much faster than worker execution since we trust the cached function.
 * 
 * @param code - User-provided strategy code
 * @param COOPERATE - COOPERATE constant value
 * @param DEFECT - DEFECT constant value
 * @param opponent_history - Opponent's move history
 * @returns The strategy result ("C" or "D")
 * @throws Error if execution fails
 */
export function executeDirect(
    code: string,
    COOPERATE: string,
    DEFECT: string,
    opponent_history: string[]
): string {
    // Trim the code
    const trimmedCode = code.trim();
    if (!trimmedCode) {
        throw new Error('Code cannot be empty');
    }

    // Get cached function (should already be validated)
    const cacheKey = createCacheKey(trimmedCode, COOPERATE, DEFECT);
    const strategyFunction = functionCache.get(cacheKey);

    if (!strategyFunction) {
        // Function not cached - this shouldn't happen if validateAndCacheFunction was called
        // But we'll compile it directly as fallback (with validation)
        throw new Error('Code not validated. Please validate code first using validateAndCacheFunction.');
    }

    // Execute the cached strategy function
    try {
        const result = strategyFunction(opponent_history);

        // Validate return value
        if (result !== COOPERATE && result !== DEFECT) {
            throw new Error(`Invalid return value: expected "${COOPERATE}" or "${DEFECT}", got "${result}"`);
        }

        return result;
    } catch (error) {
        // Remove corrupted function from cache
        functionCache.delete(cacheKey);
        throw error;
    }
}

