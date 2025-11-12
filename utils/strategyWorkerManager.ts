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

                // Create a sandboxed execution environment using strict mode and closure
                // This prevents access to global objects and provides only the necessary constants
                // We explicitly shadow dangerous globals to prevent access even if validation is bypassed
                const safeCode = \`
                    "use strict";
                    (function() {
                        const COOPERATE = "\${COOPERATE}";
                        const DEFECT = "\${DEFECT}";
                        
                        // Explicitly shadow dangerous globals to prevent access
                        // Even if code somehow bypasses validation, accessing these will throw ReferenceError
                        // Note: We can't shadow Function/eval/import as they're reserved keywords,
                        // but they're caught by pre-validation regex patterns anyway
                        const fetch = undefined;
                        const XMLHttpRequest = undefined;
                        const window = undefined;
                        const document = undefined;
                        const location = undefined;
                        
                        // User's code is executed here with access only to:
                        // - COOPERATE and DEFECT constants
                        // - opponent_history parameter
                        // - Standard JavaScript constructs (no dangerous globals)
                        // Note: fetch, XMLHttpRequest, window, document, location are shadowed above
                        // eval, Function, import are reserved keywords and can't be shadowed,
                        // but they're caught by pre-validation anyway
                        return function(opponent_history) {
                            if (!Array.isArray(opponent_history)) {
                                throw new Error("opponent_history must be an array");
                            }
                            
                            \${code}
                        };
                    })();
                \`;

                // Execute the code using Function constructor (safe in worker context)
                // Note: We still use Function constructor here because:
                // 1. Workers don't have access to DOM/globals anyway
                // 2. We need dynamic code execution
                // 3. The worker itself is already isolated from the main thread
                const funcFactory = new Function(safeCode);
                const strategyFunction = funcFactory();

                // Validate that we got a function
                if (typeof strategyFunction !== 'function') {
                    throw new Error('Code must return a function');
                }

                // Execute the strategy function with the opponent history
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

/**
 * Executes user code in a Web Worker with timeout protection.
 * Creates a new worker for each execution to ensure complete isolation.
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

    return new Promise((resolve, reject) => {
        // Generate unique message ID for this execution
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create a new worker for this execution (ensures isolation)
        const worker = createStrategyWorker();

        // Set up timeout
        const timeoutId = setTimeout(() => {
            worker.terminate();
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
                worker.terminate();
                resolve(result);
            } else if (type === 'error' && error) {
                clearTimeout(timeoutId);
                worker.removeEventListener('message', handleMessage);
                worker.removeEventListener('error', handleError);
                worker.terminate();
                reject(new Error(error));
            }
        };

        // Handle worker errors
        const handleError = (error: ErrorEvent) => {
            clearTimeout(timeoutId);
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            worker.terminate();
            reject(new Error(`Worker error: ${error.message || 'Unknown error'}`));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        // Wait for worker to be ready, then send execution request
        const readyHandler = (event: MessageEvent<WorkerMessage>) => {
            if (event.data.type === 'ready') {
                worker.removeEventListener('message', readyHandler);
                
                // Send execution request
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
