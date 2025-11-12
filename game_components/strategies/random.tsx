import { Player } from "@/game_components/player";
import { COOPERATE, DEFECT } from "@/constants";
export class Random extends Player {
    constructor(name : string, score : number, history : string[]) {
        super("Random", score, history);
    }

    strategy(opponent_history : string[]) {
        const CHOICES = [COOPERATE, DEFECT];
        const choice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
        return choice;
    }
}