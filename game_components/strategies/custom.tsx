import { Player } from "@/game_components/player";
import { COOPERATE, DEFECT } from "@/constants";
import { validateCode } from "@/utils/code-security";
import { executeDirect, validateAndCacheFunction } from "@/utils/directExecutor";

// Default strategy code template
const DEFAULT_STRATEGY_CODE = `// your strategy here
// DEFECT to defect
// COOPERATE to cooperate
return COOPERATE;`;

export class Custom extends Player {
    private strategyCode: string;
    private validationPromise: Promise<void> | null = null;

    constructor(name: string, score: number, history: string[]) {
        super(name, score, history);
        // Load custom code from localStorage or use default
        this.strategyCode = typeof window !== 'undefined' 
            ? localStorage.getItem('customStrategyCode') || DEFAULT_STRATEGY_CODE
            : DEFAULT_STRATEGY_CODE;
        
        // Validate and cache the function in a worker (async, non-blocking)
        if (typeof window !== 'undefined') {
            this.validationPromise = validateAndCacheFunction(
                this.strategyCode,
                COOPERATE,
                DEFECT
            ).catch(err => {
                console.warn('Failed to validate code in worker:', err);
            });
        }
    }

    setStrategyCode(code: string) {
        // Validate code before setting
        const validation = validateCode(code);
        if (!validation.isValid) {
            throw new Error(validation.error || 'Invalid code');
        }

        this.strategyCode = code;
        if (typeof window !== 'undefined') {
            localStorage.setItem('customStrategyCode', code);
            // Validate and cache in worker (async, non-blocking)
            this.validationPromise = validateAndCacheFunction(
                code,
                COOPERATE,
                DEFECT
            ).catch(err => {
                console.warn('Failed to validate code in worker:', err);
            });
        }
    }

    /**
     * Executes the custom strategy code directly (after validation in worker).
     * 
     * Strategy:
     * 1. Code is validated/tested in a worker once when set/loaded (proves it's safe)
     * 2. Compiled function is cached
     * 3. Executes cached function directly in main thread (very fast)
     * 
     * @param opponent_history - The opponent's move history
     * @returns "C" (COOPERATE) or "D" (DEFECT)
     */
    strategy(opponent_history: string[]): string {
        // Quick validation check
        const validation = validateCode(this.strategyCode);
        if (!validation.isValid) {
            console.error('Code validation failed:', validation.error);
            return COOPERATE; // Fallback to cooperate on validation failure
        }

        try {
            // Execute cached function directly (validated in worker, now trusted)
            // This is very fast since we're just calling a cached function
            return executeDirect(
                this.strategyCode,
                COOPERATE,
                DEFECT,
                opponent_history
            );
        } catch (error) {
            // If function not cached yet, wait for validation (should be rare)
            if (this.validationPromise) {
                // In practice, validation should complete quickly
                // But we fallback to COOPERATE to avoid blocking
                console.warn('Code not yet validated, using fallback');
            }
            console.error('Error executing custom strategy:', error);
            return COOPERATE;
        }
    }
}
