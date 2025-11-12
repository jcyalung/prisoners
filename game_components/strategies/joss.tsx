import { Player } from "@/game_components/player";
import { COOPERATE, DEFECT } from "@/constants";

// Like Tit For Tat, but secretly defects 10% of the time
export class Joss extends Player {
    constructor(name : string, score : number, history : string[]) {
        super("Joss", score, history);
    }

    strategy(opponent_history : string[]) {
        if (opponent_history.length === 0) {
            return COOPERATE;
        }
        else if (Math.floor(Math.random() * 10) === 0) {
            return DEFECT;
        }
        else {
            return opponent_history.at(-1);
        }
    }
}