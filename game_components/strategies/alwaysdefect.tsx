import { Player } from "@/game_components/player";
import { DEFECT } from "@/constants";
export class AlwaysDefect extends Player {
    constructor(name : string, score : number, history : string[]) {
        super("AlwaysCooperate", score, history);
    }

    strategy(opponent_history : string[]) {
        return DEFECT;
    }
}