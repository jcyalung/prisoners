import { Player } from "@/game_components/player";
import { SCORING } from "@/constants";
export class Game {
    players : Player[] = [];

    constructor(players : Player[]) {
        this.players = players;
    }

    round(round_number : number) {
        const p1_choice = this.players[0].strategy(this.players[1].history);
        const p2_choice = this.players[1].strategy(this.players[0].history);
        const scores = SCORING[p1_choice + p2_choice];
        this.players[0].addScore(scores[0]);
        this.players[1].addScore(scores[1]);
        this.players[0].addHistory(p1_choice);
        this.players[1].addHistory(p2_choice);
        return {
            p1_choice,
            p2_choice,
            scores,
        }
    }    
}