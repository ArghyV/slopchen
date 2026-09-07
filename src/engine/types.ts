import type { Card, Suit, TrumpSuit } from './cards';

export type { Card, Suit, TrumpSuit };

export type GameAction =
  | { type: 'play'; card: Card; player: 'p0' | 'p1' }
  | { type: 'draw'; player: 'p0' | 'p1' }
  | { type: 'close_talon'; player: 'p0' | 'p1' }
  | { type: 'meld'; meldType: '20' | '40'; player: 'p0' | 'p1' }
  | { type: 'exchange'; player: 'p0' | 'p1' };

export interface GameMove {
  action: GameAction;
  timestamp: number;
}

export interface GameState {
  id: string;
  trump: TrumpSuit;
  trumpCard: Card | null;
  dealer: 'p0' | 'p1';
  talon: Card[];
  trick: Card[];
  hands: Record<'p0' | 'p1', Card[]>;
  points: Record<'p0' | 'p1', number>;
  melds: Record<'p0' | 'p1', number>;
  tricks: Record<'p0' | 'p1', number>;
  closed: boolean;
  closer: 'p0' | 'p1' | null;
  currentPlayer: 'p0' | 'p1';
  leader: 'p0' | 'p1';
  turn: number;
  history: GameMove[];
  winner: 'p0' | 'p1' | null;
}
