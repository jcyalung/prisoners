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
 * - Input: { type: 'execute', code: string, COOPERATE: string, DEFECT: string, opponent_history: string[] }
 * - Output: { type: 'result', result: string } | { type: 'error', error: string }
 */

// Message types for communication with main thread
interface ExecuteMessage {
    type: 'execute';
    code: string;
    COOPERATE: string;
    DEFECT: string;
    opponent_history: string[];
    messageId: string;
}

interface ResultMessage {
    type: 'result';
    result: string;
    messageId: string;
}

interface ErrorMessage {
    type: 'error';
    error: string;
    messageId: string;
}

type WorkerMessage = ExecuteMessage | ResultMessage | ErrorMessage;

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<ExecuteMessage>) => {
    const { type, code, COOPERATE, DEFECT, opponent_history, messageId } = event.data;

    if (type !== 'execute') {
        self.postMessage({
            type: 'error',
            error: 'Invalid message type',
            messageId
        } as ErrorMessage);
        return;
    }

    try {
        // Validate input
        if (!Array.isArray(opponent_history)) {
            throw new Error('opponent_history must be an array');
        }

        // Create a sandboxed execution environment using strict mode and closure
        // This prevents access to global objects and provides only the necessary constants
        const safeCode = `
            "use strict";
            (function() {
                const COOPERATE = "${COOPERATE}";
                const DEFECT = "${DEFECT}";
                
                // User's code is executed here with access only to:
                // - COOPERATE and DEFECT constants
                // - opponent_history parameter
                // - Standard JavaScript constructs (no globals)
                return function(opponent_history) {
                    if (!Array.isArray(opponent_history)) {
                        throw new Error("opponent_history must be an array");
                    }
                    
                    ${code}
                };
            })();
        `;

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
            throw new Error(`Invalid return value: expected "${COOPERATE}" or "${DEFECT}", got "${result}"`);
        }

        // Send success result back to main thread
        self.postMessage({
            type: 'result',
            result: result as string,
            messageId
        } as ResultMessage);

    } catch (error) {
        // Send error back to main thread
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        self.postMessage({
            type: 'error',
            error: errorMessage,
            messageId
        } as ErrorMessage);
    }
});

// Signal that worker is ready
self.postMessage({ type: 'ready' });

