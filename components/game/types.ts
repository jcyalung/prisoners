export interface RoundState {
  round: number;
  choice: 0 | 1 | 2 | 3 | 4;
  p1Score: number;
  p2Score: number;
  result: {p1_choice: string, p2_choice: string, scores: number[]};
}

export interface GameComponentProps {
  mode?: "game" | "simulation";  
  title?: string;  
  roundLimit?: number;  
  speedMax?: number;  
  speedMin?: number;  
  showWinner?: boolean;  
  historyLog?: boolean;  
  selfPlayControls?: boolean;  
  customStrategy?: boolean;  
  p1Filter?: (strategies: string[]) => string[]; 
  p2Filter?: (strategies: string[]) => string[]; 
}

export interface WinnerInfo {
  winner: string | null;
  score: number;
  isTie: boolean;
}

