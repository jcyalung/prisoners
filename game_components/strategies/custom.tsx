import { Player } from "@/game_components/player";
import { COOPERATE, DEFECT } from "@/constants";
import { validateCode } from "@/utils/code-security";
import { executeInWorkerSync } from "@/utils/syncWorkerExecutor";

// Default strategy code template
const DEFAULT_STRATEGY_CODE = `// your strategy here
// DEFECT to defect
// COOPERATE to cooperate
return COOPERATE;`;

export class Custom extends Player {
    private strategyCode: string;

    constructor(name: string, score: number, history: string[]) {
        super(name, score, history);
        // Load custom code from localStorage or use default
        this.strategyCode = typeof window !== 'undefined' 
            ? localStorage.getItem('customStrategyCode') || DEFAULT_STRATEGY_CODE
            : DEFAULT_STRATEGY_CODE;
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
        }
    }

    /**
     * Executes the custom strategy code in a Web Worker.
     * This method is synchronous to match the Player interface,
     * but internally executes code in a worker thread for security.
     * 
     * @param opponent_history - The opponent's move history
     * @returns "C" (COOPERATE) or "D" (DEFECT)
     */
    strategy(opponent_history: string[]): string {
        // Validate code before execution
        const validation = validateCode(this.strategyCode);
        if (!validation.isValid) {
            console.error('Code validation failed:', validation.error);
            return COOPERATE; // Fallback to cooperate on validation failure
        }

        try {
            // Execute code in Web Worker synchronously
            // This blocks the main thread until the worker completes
            // but ensures all user code runs in an isolated worker thread
            return executeInWorkerSync(
                this.strategyCode,
                COOPERATE,
                DEFECT,
                opponent_history,
                1000 // 1 second timeout
            );
        } catch (error) {
            console.error('Error executing custom strategy in worker:', error);
            // Fallback to default strategy on error
            return COOPERATE;
        }
    }
}
