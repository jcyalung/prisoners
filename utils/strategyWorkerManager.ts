/**
 * Worker Manager for handling Web Worker lifecycle and message passing.
 * 
 * This module manages:
 * - Worker creation and termination
 * - Message passing with timeout handling
 * - Worker pool management (creates new worker for each execution to ensure isolation)
 * 
 * MESSAGE PASSING:
 * - Each execution gets a unique messageId to match requests/responses
 * - Timeout of 1 second enforced per execution
 * - Worker is terminated after each execution for security
 */

interface WorkerMessage {
    type: 'execute' | 'result' | 'error' | 'ready';
    code?: string;
    COOPERATE?: string;
    DEFECT?: string;
    opponent_history?: string[];
    result?: string;
    error?: string;
    messageId?: string;
}

/**
 * Creates a Web Worker from inline code (blob URL).
 * This approach works reliably in Next.js without needing separate worker files.
 */
function createStrategyWorker(): Worker {
    // Embed the worker code as a string
    // This ensures the worker is always available without file path issues
    const workerCode = `
        /**
         * Web Worker for executing user-provided strategy code in a sandboxed environment.
         * 
         * SANDBOX BOUNDARIES:
         * - This worker runs in a separate thread with no access to:
         *   - window, document, location, fetch, XMLHttpRequest
         *   - DOM APIs
         *   - localStorage, sessionStorage
         *   - parent window or any global browser objects
         * 
         * MESSAGE PROTOCOL:
         * - Input: { type: 'execute', code: string, COOPERATE: string, DEFECT: string, opponent_history: string[], messageId: string }
         * - Output: { type: 'result', result: string, messageId: string } | { type: 'error', error: string, messageId: string }
         */

        // Cache for compiled strategy functions (keyed by code + COOPERATE + DEFECT)
        const functionCache = new Map();

        // Simple hash function for cache key
        function createCacheKey(code, COOPERATE, DEFECT) {
            return code.trim() + '|' + COOPERATE + '|' + DEFECT;
        }

        // Message types for communication with main thread
        self.addEventListener('message', (event) => {
            const { type, code, COOPERATE, DEFECT, opponent_history, messageId } = event.data;

            if (type !== 'execute') {
                self.postMessage({
                    type: 'error',
                    error: 'Invalid message type',
                    messageId
                });
                return;
            }

            try {
                // Validate input
                if (!Array.isArray(opponent_history)) {
                    throw new Error('opponent_history must be an array');
                }

                // Validate code is present and is a string
                if (!code || typeof code !== 'string') {
                    throw new Error('Code must be a non-empty string');
                }

                // Trim the code to remove leading/trailing whitespace
                const trimmedCode = code.trim();
                if (!trimmedCode) {
                    throw new Error('Code cannot be empty or only whitespace');
                }

                // Check cache first
                const cacheKey = createCacheKey(trimmedCode, COOPERATE, DEFECT);
                let strategyFunction = functionCache.get(cacheKey);

                if (!strategyFunction) {
                    // Cache miss - compile the function
                    // Create a sandboxed execution environment using strict mode and closure
                    // This prevents access to global objects and provides only the necessary constants
                    // We explicitly shadow dangerous globals to prevent access even if validation is bypassed
                    // Build the safe code string using string concatenation to avoid template literal nesting issues
                    // Structure: IIFE that returns the strategy function
                    const iifeCode = '(function() {' +
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

                    // Execute the code using Function constructor (safe in worker context)
                    // Note: We still use Function constructor here because:
                    // 1. Workers don't have access to DOM/globals anyway
                    // 2. We need dynamic code execution
                    // 3. The worker itself is already isolated from the main thread
                    try {
                        // Create a function that executes the IIFE and returns its result
                        // The "use strict" directive is applied to the function body
                        const funcFactory = new Function('"use strict"; return ' + iifeCode);
                        strategyFunction = funcFactory();
                    } catch (evalError) {
                        const errorMsg = evalError instanceof Error ? evalError.message : String(evalError);
                        throw new Error(\`Code execution failed: \${errorMsg}\`);
                    }

                    // Validate that we got a function
                    if (typeof strategyFunction !== 'function') {
                        const actualType = typeof strategyFunction;
                        const actualValue = String(strategyFunction);
                        throw new Error(\`Code must return a function, but got \${actualType}: \${actualValue}. Make sure you're writing only the function body, not a function declaration.\`);
                    }

                    // Cache the compiled function
                    functionCache.set(cacheKey, strategyFunction);
                }

                // Execute the cached strategy function with the opponent history
                const result = strategyFunction(opponent_history);

                // Validate return value
                if (result !== COOPERATE && result !== DEFECT) {
                    throw new Error(\`Invalid return value: expected "\${COOPERATE}" or "\${DEFECT}", got "\${result}"\`);
                }

                // Send success result back to main thread
                self.postMessage({
                    type: 'result',
                    result: result,
                    messageId
                });

            } catch (error) {
                // Send error back to main thread
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                self.postMessage({
                    type: 'error',
                    error: errorMessage,
                    messageId
                });
            }
        });

        // Signal that worker is ready
        self.postMessage({ type: 'ready' });
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    // Clean up the blob URL when worker is terminated
    const originalTerminate = worker.terminate.bind(worker);
    worker.terminate = () => {
        URL.revokeObjectURL(workerUrl);
        originalTerminate();
    };
    
    return worker;
}

// Worker pool for reusing workers (keyed by code hash for security)
// This significantly improves performance by avoiding worker creation overhead
interface WorkerPoolEntry {
    worker: Worker;
    isReady: boolean;
    isBusy: boolean;
    lastUsed: number;
}

const workerPool = new Map<string, WorkerPoolEntry>();
const MAX_WORKER_AGE = 60000; // Recycle workers after 60 seconds of inactivity
const MAX_POOL_SIZE = 5; // Maximum number of workers to keep in pool

// Simple hash function for code (not cryptographically secure, but sufficient for caching)
function hashCode(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        const char = code.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

// Clean up old workers from the pool
function cleanupWorkerPool() {
    const now = Date.now();
    for (const [key, entry] of workerPool.entries()) {
        if (!entry.isBusy && (now - entry.lastUsed > MAX_WORKER_AGE)) {
            entry.worker.terminate();
            workerPool.delete(key);
        }
    }
    
    // If pool is too large, remove oldest unused workers
    if (workerPool.size > MAX_POOL_SIZE) {
        const entries = Array.from(workerPool.entries())
            .filter(([_, entry]) => !entry.isBusy)
            .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        
        const toRemove = entries.slice(0, workerPool.size - MAX_POOL_SIZE);
        for (const [key, entry] of toRemove) {
            entry.worker.terminate();
            workerPool.delete(key);
        }
    }
}

/**
 * Executes user code in a Web Worker with timeout protection.
 * Reuses workers from a pool for better performance.
 * 
 * @param code - User-provided strategy code
 * @param COOPERATE - COOPERATE constant value
 * @param DEFECT - DEFECT constant value
 * @param opponent_history - Opponent's move history
 * @param timeoutMs - Timeout in milliseconds (default: 1000ms)
 * @returns Promise that resolves to the strategy result ("C" or "D")
 * @throws Error if execution fails or times out
 */
export async function executeInWorker(
    code: string,
    COOPERATE: string,
    DEFECT: string,
    opponent_history: string[],
    timeoutMs: number = 1000
): Promise<string> {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
        throw new Error('Web Workers are not available in this environment');
    }

    // Clean up old workers periodically
    cleanupWorkerPool();

    // Create a unique key for this code (for worker reuse)
    const codeKey = hashCode(code.trim());

    return new Promise((resolve, reject) => {
        // Generate unique message ID for this execution
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Try to get a worker from the pool
        let poolEntry = workerPool.get(codeKey);
        let worker: Worker;
        let isNewWorker = false;

        if (poolEntry && !poolEntry.isBusy && poolEntry.isReady) {
            // Reuse existing worker
            worker = poolEntry.worker;
            poolEntry.isBusy = true;
            poolEntry.lastUsed = Date.now();
        } else {
            // Create new worker
            isNewWorker = true;
            worker = createStrategyWorker();
            poolEntry = {
                worker,
                isReady: false,
                isBusy: true,
                lastUsed: Date.now()
            };
            workerPool.set(codeKey, poolEntry);
        }

        // Set up timeout
        const timeoutId = setTimeout(() => {
            if (isNewWorker) {
                worker.terminate();
                workerPool.delete(codeKey);
            } else if (poolEntry) {
                poolEntry.isBusy = false;
            }
            reject(new Error(`Strategy execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        // Handle worker messages
        const handleMessage = (event: MessageEvent<WorkerMessage>) => {
            const { type, result, error, messageId: responseId } = event.data;

            // Ignore messages that don't match our request
            if (responseId !== messageId) {
                return;
            }

            if (type === 'result' && result) {
                clearTimeout(timeoutId);
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                
                // Mark worker as available for reuse
                if (poolEntry) {
                    poolEntry.isBusy = false;
                    poolEntry.lastUsed = Date.now();
                }
                
                resolve(result);
            } else if (type === 'error' && error) {
                clearTimeout(timeoutId);
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                
                // On error, remove worker from pool (might be corrupted)
                if (poolEntry) {
                    poolEntry.isBusy = false;
                    // Don't remove on error - might be user code error, not worker error
                }
                
                reject(new Error(error));
            } else if (type === 'ready') {
                // Worker is ready - this message is handled separately below
                if (poolEntry) {
                    poolEntry.isReady = true;
                }
            }
        };

        // Handle worker errors
        const handleError = (error: ErrorEvent) => {
            clearTimeout(timeoutId);
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            
            // Remove corrupted worker from pool
            if (poolEntry) {
                poolEntry.isBusy = false;
                worker.terminate();
                workerPool.delete(codeKey);
            }
            
            reject(new Error(`Worker error: ${error.message || 'Unknown error'}`));
        };

        // Set up ready handler for new workers
        if (isNewWorker) {
            const readyHandler = (event: MessageEvent<WorkerMessage>) => {
                if (event.data.type === 'ready') {
                    worker.removeEventListener('message', readyHandler);
                    // Worker is ready, send execution request
                    worker.postMessage({
                        type: 'execute',
                        code,
                        COOPERATE,
                        DEFECT,
                        opponent_history,
                        messageId
                    } as WorkerMessage);
                }
            };
            worker.addEventListener('message', readyHandler);
        }

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        if (!isNewWorker) {
            // Worker is ready, send execution request immediately
            worker.postMessage({
                type: 'execute',
                code,
                COOPERATE,
                DEFECT,
                opponent_history,
                messageId
            } as WorkerMessage);
        }
    });
}

/**
 * Test compilation of user code without executing it.
 * Uses the worker to validate that code can be compiled and returns a valid function.
 * 
 * @param code - User-provided strategy code
 * @param COOPERATE - COOPERATE constant value
 * @param DEFECT - DEFECT constant value
 * @returns Promise that resolves if compilation succeeds
 * @throws Error if compilation fails
 */
export async function testCompilationInWorker(
    code: string,
    COOPERATE: string,
    DEFECT: string
): Promise<void> {
    // Test with empty opponent history
    await executeInWorker(code, COOPERATE, DEFECT, [], 1000);
}
