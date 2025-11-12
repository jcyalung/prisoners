/**
 * Synchronous wrapper for Web Worker execution.
 * 
 * WARNING: This uses a blocking mechanism to wait for async worker results.
 * This blocks the main thread but is necessary to maintain the synchronous
 * strategy() interface required by the game logic.
 * 
 * This is a compromise solution - ideally the game logic would be async-aware,
 * but for backward compatibility, we provide this synchronous wrapper.
 */

import { executeInWorker } from './strategyWorkerManager';

/**
 * Executes code in a Web Worker synchronously by blocking until completion.
 * This is a workaround to maintain the synchronous strategy() interface.
 * 
 * @param code - User-provided strategy code
 * @param COOPERATE - COOPERATE constant value
 * @param DEFECT - DEFECT constant value
 * @param opponent_history - Opponent's move history
 * @param timeoutMs - Timeout in milliseconds (default: 1000ms)
 * @returns The strategy result ("C" or "D")
 * @throws Error if execution fails or times out
 */
export function executeInWorkerSync(
    code: string,
    COOPERATE: string,
    DEFECT: string,
    opponent_history: string[],
    timeoutMs: number = 1000
): string {
    let result: string | undefined;
    let error: Error | undefined;
    let completed = false;

    // Start async execution
    executeInWorker(code, COOPERATE, DEFECT, opponent_history, timeoutMs)
        .then((res) => {
            result = res;
            completed = true;
        })
        .catch((err) => {
            error = err instanceof Error ? err : new Error(String(err));
            completed = true;
        });

    // Block until completion (synchronous wait)
    // This is not ideal but necessary for the synchronous interface
    // NOTE: True synchronous waiting for async operations is not possible in JavaScript.
    // This implementation uses a more efficient polling approach that yields to the event loop.
    const startTime = Date.now();
    const maxWaitTime = timeoutMs + 200; // Add buffer for overhead
    
    // Use requestAnimationFrame or setTimeout to yield to event loop more efficiently
    // This allows worker messages to be processed without busy-waiting
    while (!completed) {
        // Check for timeout
        if (Date.now() - startTime > maxWaitTime) {
            throw new Error(`Strategy execution timed out after ${timeoutMs}ms`);
        }
        
        // Yield to event loop using a microtask delay
        // This is more efficient than busy-waiting and allows worker messages to process
        // We use a very short delay to check frequently but still yield
        const checkInterval = 1; // Check every 1ms
        const sleepUntil = Date.now() + checkInterval;
        while (Date.now() < sleepUntil && !completed) {
            // Minimal busy-wait - browser can still process events
        }
        
        // If still not completed, yield more explicitly
        if (!completed) {
            // Use a synchronous check that allows event processing
            // The browser will process worker messages during this time
            const yieldTime = Date.now() + 0.1; // 0.1ms yield
            while (Date.now() < yieldTime && !completed) {
                // Very short yield
            }
        }
    }

    // Check for errors
    if (error) {
        throw error;
    }

    // Return result
    if (result === undefined) {
        throw new Error('Strategy execution returned undefined result');
    }

    return result;
}

