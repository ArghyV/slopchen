/**
 * UI Types for Slopchen
 * Type definitions for the React UI components
 */

import type { Card, Suit, TrumpSuit } from '../../src/engine/cards';
import type { GameState, GameAction, GameMove } from '../../src/engine/types';

/** Player identifiers */
export type Player = 'p0' | 'p1';

/** UI Game Phase */
export type GamePhase = 
  | 'idle'
  | 'waiting_for_player'
  | 'ai_thinking'
  | 'game_over';

/** UI State - extends GameState with UI-specific properties */
export interface UIState {
  gameState: GameState | null;
  phase: GamePhase;
  selectedCard: Card | null;
  lastPlayedCard: Card | null;
  animationQueue: AnimationItem[];
  error: string | null;
}

/** Animation types for card movements */
export type AnimationType = 
  | 'play_card'
  | 'draw_card'
  | 'meld_animation'
  | 'close_talon'
  | 'game_over';

/** Animation item for the animation queue */
export interface AnimationItem {
  type: AnimationType;
  card?: Card;
  player?: Player;
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  duration: number;
  delay?: number;
}

/** Card display props */
export interface CardDisplayProps {
  card: Card;
  suit: Suit;
  rank: string;
  isTrump: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  isFaceUp: boolean;
  onClick?: (card: Card) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Hand display props */
export interface HandProps {
  cards: Card[];
  trump: TrumpSuit;
  selectedCard: Card | null;
  disabledCards: Card[];
  onCardSelect: (card: Card) => void;
  onCardPlay: (card: Card) => void;
  player: Player;
  isCurrentPlayer: boolean;
}

/** Talon display props */
export interface TalonProps {
  cards: Card[];
  isClosed: boolean;
  trump: TrumpSuit;
  onClick?: () => void;
}

/** Trick display props */
export interface TrickProps {
  cards: Card[];
  trump: TrumpSuit;
  leadSuit: Suit | null;
  winner?: Player;
}

/** Status bar props */
export interface StatusBarProps {
  points: Record<Player, number>;
  melds: Record<Player, number>;
  currentPlayer: Player;
  trump: TrumpSuit;
  closed: boolean;
  closer: Player | null;
  gameOver: boolean;
  winner: Player | null;
}

/** Action bar props */
export interface ActionBarProps {
  legalActions: GameAction[];
  onAction: (action: GameAction) => void;
  currentPlayer: Player;
  isAI: boolean;
  phase: GamePhase;
}

/** Game action with UI metadata */
export interface UIAction {
  action: GameAction;
  label: string;
  disabled?: boolean;
  primary?: boolean;
}

/** Action button props */
export interface ActionButtonProps {
  action: UIAction;
  onClick: () => void;
  disabled: boolean;
}

/** Suit display names */
export const SUIT_NAMES: Record<Suit, string> = {
  H: 'Hearts',
  S: 'Bells',
  E: 'Acorns',
  G: 'Leaves'
};

/** Suit symbols for display */
export const SUIT_SYMBOLS: Record<Suit, string> = {
  H: '♥',
  S: '♦',
  E: '♣',
  G: '♠'
};

/** Rank display names */
export const RANK_NAMES: Record<string, string> = {
  A: 'A',
  '10': '10',
  K: 'K',
  O: 'O',
  U: 'U'
};

/** Rank sort order for display */
export const RANK_DISPLAY_ORDER: string[] = ['U', 'O', 'K', '10', 'A'];

/** Card points for display */
export const CARD_POINTS_DISPLAY: Record<string, number> = {
  A: 11,
  '10': 10,
  K: 4,
  O: 3,
  U: 2
};

/** Get suit colour for display */
export function getSuitColour(suit: Suit): string {
  const colours: Record<Suit, string> = {
    H: '#e63946', // Swiss red
    S: '#f1c40f', // Swiss yellow
    E: '#2a9d8f', // Swiss green
    G: '#1d3557'  // Swiss blue
  };
  return colours[suit];
}

/** Get rank symbol for display */
export function getRankSymbol(rank: string): string {
  return RANK_NAMES[rank] || rank;
}

/** Get suit symbol for display */
export function getSuitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

/** Format card for display */
export function formatCard(card: Card): string {
  const suit = card[0] as Suit;
  const rank = card.slice(1);
  return `${getRankSymbol(rank)}${getSuitSymbol(suit)}`;
}

/** Check if action is play action */
export function isPlayAction(action: GameAction): action is { type: 'play'; card: Card; player: Player } {
  return action.type === 'play';
}

/** Check if action is draw action */
export function isDrawAction(action: GameAction): action is { type: 'draw'; player: Player } {
  return action.type === 'draw';
}

/** Check if action is close talon action */
export function isCloseTalonAction(action: GameAction): action is { type: 'close_talon'; player: Player } {
  return action.type === 'close_talon';
}

/** Check if action is meld action */
export function isMeldAction(action: GameAction): action is { type: 'meld'; meldType: '20' | '40'; player: Player } {
  return action.type === 'meld';
}

/** Check if action is exchange action */
export function isExchangeAction(action: GameAction): action is { type: 'exchange'; player: Player } {
  return action.type === 'exchange';
}
