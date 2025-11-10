import { Player } from "@/game_components/player";
import { COOPERATE } from "@/constants";
export class AlwaysCooperate extends Player {
    constructor(name : string, score : number, history : string[]) {
        super("AlwaysCooperate", score, history);
    }

    strategy(opponent_history : string[]) {
        return COOPERATE;
    }
}