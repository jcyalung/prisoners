/**
 * Code validation utilities for user-provided strategy code.
 * 
 * This module provides pre-execution validation to catch security issues
 * before code is sent to the Web Worker for execution.
 * 
 * Note: Actual code execution happens in workers/strategyWorker.ts via
 * utils/strategyWorkerManager.ts - this module only validates code structure.
 */

// Dangerous patterns that should be rejected
const DANGEROUS_PATTERNS = [
    /\beval\s*\(/i,                    // eval()
    /\bFunction\s*\(/i,                // Function constructor
    /\bnew\s+Function\s*\(/i,          // new Function()
    /\bwindow\b/i,                     // window object
    /\bdocument\b/i,                   // document object
    /\blocation\b/i,                   // location object
    /\bfetch\s*\(/i,                   // fetch API
    /\bXMLHttpRequest\b/i,             // XHR
    /\bimport\s*\(/i,                  // dynamic import
    /\brequire\s*\(/i,                 // require()
    /\bprocess\b/i,                    // process object (Node.js)
    /\bglobal\b/i,                     // global object
    /\bthis\b/i,                       // this context
    /\barguments\b/i,                  // arguments object
    /\.\s*constructor\b/i,              // constructor access
    /\b__proto__\b/i,                  // __proto__ access
    /\bprototype\b/i,                  // prototype access
    /\bconsole\s*\.\s*(log|warn|error|info|debug)/i, // console methods (optional, can allow)
];

/**
 * Validates user code for security issues before execution.
 * This is a pre-check that runs on the main thread before code is sent to the Web Worker.
 * 
 * @param code - The user-provided code to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateCode(code: string): { isValid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
        return { isValid: false, error: 'Code must be a non-empty string' };
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            const match = code.match(pattern);
            return { 
                isValid: false, 
                error: `Security violation: Dangerous pattern detected: "${match?.[0] || 'unknown'}"` 
            };
        }
    }

    // Check for function declarations - users should write only the function body
    // The worker wraps the code in a function, so writing a function declaration will cause errors
    if (/\bfunction\s+\w+\s*\(/.test(code) || /\bconst\s+\w+\s*=\s*function\s*\(/.test(code) || /\bconst\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(code)) {
        return {
            isValid: false,
            error: 'Do not write a function declaration. Write only the function body code. The function wrapper is added automatically.'
        };
    }

    // Check that code contains a return statement
    if (!/\breturn\s+/.test(code)) {
        return { isValid: false, error: 'Code must contain a return statement' };
    }

    // Check that return value is COOPERATE or DEFECT
    const returnMatch = code.match(/\breturn\s+([^;]+)/);
    if (returnMatch) {
        const returnValue = returnMatch[1].trim();
        if (!/COOPERATE|DEFECT/.test(returnValue)) {
            // Allow complex expressions that might evaluate to COOPERATE/DEFECT
            // But warn if it's clearly not one of them
            if (!/opponent_history|\.|\[|\(|===|!==|if|else|ternary/.test(returnValue)) {
                return { 
                    isValid: false, 
                    error: 'Return value must be COOPERATE or DEFECT' 
                };
            }
        }
    }

    // Check code length (prevent extremely long code)
    if (code.length > 10000) {
        return { isValid: false, error: 'Code is too long (max 10,000 characters)' };
    }

    return { isValid: true };
}

// Re-export worker execution functions for convenience
// These functions execute code in a Web Worker, not on the main thread
export { executeInWorker, testCompilationInWorker } from './strategyWorkerManager';

/**
 * Creates a safe strategy function that executes code in a Web Worker.
 * 
 * NOTE: This function returns a Promise-based function, not a synchronous function.
 * The returned function must be awaited when called.
 * 
 * @param code - The user-provided code
 * @param COOPERATE - The COOPERATE constant value
 * @param DEFECT - The DEFECT constant value
 * @returns A Promise-returning function that executes the code safely in a worker
 */
export async function createSafeStrategyFunction(
    code: string,
    COOPERATE: string,
    DEFECT: string
): Promise<(opponent_history: string[]) => Promise<string>> {
    // Validate code first
    const validation = validateCode(code);
    if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid code');
    }

    // Return a function that executes code in worker
    return async (opponent_history: string[]) => {
        const { executeInWorker } = await import('./strategyWorkerManager');
        return executeInWorker(code, COOPERATE, DEFECT, opponent_history, 1000);
    };
}

/**
 * Test compilation without fallback - throws errors for validation.
 * Executes code in a Web Worker to validate compilation.
 * 
 * @param code - The user-provided code
 * @param COOPERATE - The COOPERATE constant value
 * @param DEFECT - The DEFECT constant value
 * @returns Promise that resolves if compilation succeeds
 * @throws Error if compilation fails
 */
export async function testCompilation(
    code: string,
    COOPERATE: string,
    DEFECT: string
): Promise<void> {
    const { testCompilationInWorker } = await import('./strategyWorkerManager');
    return testCompilationInWorker(code, COOPERATE, DEFECT);
}

/**
 * Executes strategy code with timeout protection using Web Worker.
 * 
 * @param strategyFunction - A function that returns a Promise resolving to the strategy result
 * @param opponent_history - The opponent history array
 * @param timeoutMs - Timeout in milliseconds (default: 1000ms, handled by worker)
 * @returns Promise that resolves to the result or COOPERATE as fallback
 */
export async function executeWithTimeout(
    strategyFunction: (opponent_history: string[]) => Promise<string>,
    opponent_history: string[],
    timeoutMs: number = 1000
): Promise<string> {
    const COOPERATE = "C";
    const DEFECT = "D";
    
    try {
        // Execute the function (which runs in worker)
        const result = await strategyFunction(opponent_history);
        
        // Validate return value
        if (result !== COOPERATE && result !== DEFECT) {
            console.warn('Invalid return value from strategy, defaulting to COOPERATE. Got:', result);
            return COOPERATE;
        }
        
        return result;
    } catch (error) {
        console.error('Error executing strategy:', error);
        return COOPERATE;
    }
}
