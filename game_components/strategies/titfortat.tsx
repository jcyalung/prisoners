import { Player } from "@/game_components/player";
import { COOPERATE } from "@/constants";
export class TitForTat extends Player {
    constructor(name : string, score : number, history : string[]) {
        super("TitForTat", score, history);
    }

    strategy(opponent_history : string[]) {
        if (opponent_history.length === 0) {
            return COOPERATE;
        }
        return opponent_history[opponent_history.length - 1];
    }
}