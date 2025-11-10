export class Player {
    name : string;
    score : number;
    history : string[];

    constructor(name : string, score : number, history : string[]) {
        this.name = name;
        this.score = 0;
        this.history = [];
    }

    addScore(score : number) {
        this.score += score;
    }

    addHistory(history : string) {
        this.history.push(history);
    }

    getHistory() {
        return this.history;
    }

    getScore() {
        return this.score;
    }

    strategy(opponent_history : string[]) : string {
        return "";
    }
}
