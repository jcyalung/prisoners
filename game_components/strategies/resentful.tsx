import { Player } from "@/game_components/player";
import { COOPERATE, DEFECT } from "@/constants";
export class Resentful extends Player {
    private opponent_defected : boolean = false;
    constructor(name : string, score : number, history : string[]) {
        super("Resentful", score, history);
    }

    strategy(opponent_history : string[]) {
        console.log(this.opponent_defected);
        if (opponent_history.length === 0) {
            return COOPERATE;
        }
        else if (opponent_history.includes(DEFECT)) {
            this.opponent_defected = true;
        }
        
        if (this.opponent_defected) {
            return DEFECT;
        }
        else { return COOPERATE; }
    }
}