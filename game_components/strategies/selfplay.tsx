import { Player } from "@/game_components/player";
import { COOPERATE } from "@/constants";
export class SelfPlay extends Player {
    private userChoice: string = COOPERATE;

    constructor(name : string, score : number, history : string[]) {
        super(name, score, history);
    }

    setChoice(choice: string) {
        this.userChoice = choice;
    }

    strategy(opponent_history : string[]) : string {
        return this.userChoice;
    }

    choose(opponent_history : string[], choice : string) {
        return choice;
    }
}