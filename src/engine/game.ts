import { shuffleDeck, deal } from './deck';
import { getSuit, type Card, type Suit, type TrumpSuit } from './cards';
import { getLegalMoves, isLegalPlay, canCloseTalon, canMeld, getMeldType } from './rules';
import { getTrickPoints } from './scoring';
import { resolveTrick, drawCards } from './turn';
import type { GameAction, GameMove, GameState } from './types';

// Re-export types
export type { Card, Suit, TrumpSuit } from './cards';
export type { GameAction, GameMove, GameState };

/**
 * Generate a unique ID for a game.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Initialize a new game state.
 * 
 * @param dealer - The player who deals (p0 or p1)
 * @param seed - Optional seed for deterministic shuffling
 * @returns A new GameState with shuffled deck, dealt cards, and random trump
 */
export function initializeGame(dealer: 'p0' | 'p1' = 'p0', seed?: number): GameState {
  const shuffledDeck = shuffleDeck(seed);
  const { p0, p1, talon } = deal(shuffledDeck);
  
  // Select random trump suit
  const suits: Suit[] = ['H', 'S', 'E', 'G'];
  const trumpIndex = seed !== undefined 
    ? (seed % suits.length + suits.length) % suits.length
    : Math.floor(Math.random() * suits.length);
  const trump = suits[trumpIndex];
  
  return {
    id: generateId(),
    trump,
    dealer,
    talon,
    trick: [],
    hands: { p0, p1 },
    points: { p0: 0, p1: 0 },
    melds: { p0: 0, p1: 0 },
    tricks: { p0: 0, p1: 0 },
    closed: false,
    closer: null,
    currentPlayer: dealer === 'p0' ? 'p1' : 'p0', // Non-dealer plays first
    leader: dealer === 'p0' ? 'p1' : 'p0',
    turn: 0,
    history: [],
    winner: null
  };
}

/**
 * Apply a game action to the current state and return a new state.
 * 
 * @param state - The current game state
 * @param move - The game move to apply
 * @returns A new GameState after applying the move
 */
export function applyMove(state: GameState, move: GameMove): GameState {
  const action = move.action;
  const newState = { ...state, history: [...state.history, move] };
  
  switch (action.type) {
    case 'play':
      return applyPlayAction(newState, action);
    case 'draw':
      return applyDrawAction(newState, action);
    case 'close_talon':
      return applyCloseTalonAction(newState, action);
    case 'meld':
      return applyMeldAction(newState, action);
    case 'exchange':
      return applyExchangeAction(newState, action);
    default:
      // TypeScript should never reach here if all action types are handled
      const _exhaustiveCheck: never = action;
      throw new Error(`Unknown action type: ${(_exhaustiveCheck as any).type}`);
  }
}

/**
 * Apply a play action to the game state.
 */
function applyPlayAction(state: GameState, action: Extract<GameAction, { type: 'play' }>): GameState {
  const { card, player } = action;
  
  // Check if the play is legal
  if (!isLegalPlay(state, card, player)) {
    throw new Error(`Illegal play: ${player} cannot play ${card}`);
  }
  
  // Check whose turn it is
  if (state.currentPlayer !== player) {
    throw new Error(`Not ${player}'s turn`);
  }
  
  const newState = { ...state };
  
  // Remove card from player's hand
  newState.hands[player] = newState.hands[player].filter(c => c !== card);
  
  // Add card to trick
  newState.trick.push(card);
  
  // If trick has 2 cards, resolve it
  if (newState.trick.length === 2) {
    return resolveTrick(newState);
  }
  
  // Switch to other player
  newState.currentPlayer = player === 'p0' ? 'p1' : 'p0';
  newState.turn++;
  
  return newState;
}

/**
 * Apply a draw action to the game state.
 */
function applyDrawAction(state: GameState, action: Extract<GameAction, { type: 'draw' }>): GameState {
  // Drawing is typically handled automatically by resolveTrick
  // This action type might not be used directly
  return drawCards(state);
}

/**
 * Apply a close talon action to the game state.
 */
function applyCloseTalonAction(state: GameState, action: Extract<GameAction, { type: 'close_talon' }>): GameState {
  const { player } = action;
  
  if (!canCloseTalon(state, player)) {
    throw new Error(`Cannot close talon: ${player}`);
  }
  
  const newState = { ...state };
  newState.closed = true;
  newState.closer = player;
  newState.currentPlayer = player === 'p0' ? 'p1' : 'p0';
  newState.turn++;
  
  return newState;
}

/**
 * Apply a meld action to the game state.
 */
function applyMeldAction(state: GameState, action: Extract<GameAction, { type: 'meld' }>): GameState {
  const { meldType, player } = action;
  
  if (!canMeld(state, player)) {
    throw new Error(`Cannot meld: ${player}`);
  }
  
  const expectedMeldType = getMeldType(state, player);
  if (expectedMeldType !== meldType) {
    throw new Error(`Wrong meld type: expected ${expectedMeldType}, got ${meldType}`);
  }
  
  const newState = { ...state };
  newState.melds[player] += meldType === '20' ? 20 : 40;
  newState.currentPlayer = player === 'p0' ? 'p1' : 'p0';
  newState.turn++;
  
  return newState;
}

/**
 * Apply an exchange action to the game state.
 */
function applyExchangeAction(state: GameState, action: Extract<GameAction, { type: 'exchange' }>): GameState {
  const { player } = action;
  
  // Check if player can exchange
  const hand = state.hands[player];
  const trumpUnter = `${state.trump}U` as Card;
  const trumpAce = `${state.trump}A` as Card;
  
  if (!hand.includes(trumpUnter)) {
    throw new Error(`Cannot exchange: ${player} does not have trump Unter`);
  }
  
  if (hand.includes(trumpAce)) {
    throw new Error(`Cannot exchange: ${player} already has trump Ace`);
  }
  
  // Find trump Ace in talon or opponent's hand
  // For simplicity, we'll assume it's in the talon
  const talonIndex = state.talon.findIndex(c => c === trumpAce);
  if (talonIndex === -1) {
    // Check opponent's hand
    const opponent = player === 'p0' ? 'p1' : 'p0';
    if (!state.hands[opponent].includes(trumpAce)) {
      throw new Error(`Cannot exchange: trump Ace not found in talon or opponent's hand`);
    }
    // Exchange with opponent - remove from opponent, add to player
    const newState = { ...state };
    newState.hands[player] = newState.hands[player].map(c => c === trumpUnter ? trumpAce : c);
    newState.hands[opponent] = newState.hands[opponent].map(c => c === trumpAce ? trumpUnter : c);
    newState.currentPlayer = player === 'p0' ? 'p1' : 'p0';
    newState.turn++;
    return newState;
  }
  
  // Exchange with talon
  const newState = { ...state };
  newState.hands[player] = newState.hands[player].map(c => c === trumpUnter ? trumpAce : c);
  newState.talon[talonIndex] = trumpUnter;
  newState.currentPlayer = player === 'p0' ? 'p1' : 'p0';
  newState.turn++;
  
  return newState;
}

/**
 * Get the current game outcome with Schneider/Schwarz scoring.
 * 
 * Game points:
 * - 1 point: opponent has 33+ points or took at least 1 trick
 * - 2 points: opponent has < 33 points AND took at least 1 trick (Schneider)
 * - 3 points: opponent has < 33 points AND took NO tricks (Schwarz)
 * 
 * @param state - The current game state
 * @returns Object with winner and gamePoints, or null if game is not over
 */
export function getGameOutcome(state: GameState): { winner: 'p0' | 'p1' | null; gamePoints: Record<'p0' | 'p1', number> } {
  const p0Total = state.points.p0 + state.melds.p0;
  const p1Total = state.points.p1 + state.melds.p1;
  const p0Tricks = state.tricks.p0 || 0;
  const p1Tricks = state.tricks.p1 || 0;
  
  // Check if game is over by points
  if (p0Total >= 66 || p1Total >= 66) {
    const winner = p0Total >= 66 ? 'p0' : 'p1';
    const loser = winner === 'p0' ? 'p1' : 'p0';
    const loserTotal = loser === 'p0' ? p0Total : p1Total;
    const loserTricks = loser === 'p0' ? p0Tricks : p1Tricks;
    
    // Calculate game points for winner based on Schneider/Schwarz
    let winnerGamePoints = 1;
    if (loserTotal < 33 && loserTricks >= 1) {
      winnerGamePoints = 2; // Schneider
    } else if (loserTotal < 33 && loserTricks === 0) {
      winnerGamePoints = 3; // Schwarz
    }
    
    return { winner, gamePoints: { p0: winner === 'p0' ? winnerGamePoints : 0, p1: winner === 'p1' ? winnerGamePoints : 0 } };
  }
  
  // Check if talon is empty and a player has no cards
  if (state.talon.length === 0) {
    if (state.hands.p0.length === 0) {
      const winner = 'p1' as const;
      const loserTotal = p0Total;
      const loserTricks = p0Tricks;
      let winnerGamePoints = 1;
      if (loserTotal < 33 && loserTricks >= 1) {
        winnerGamePoints = 2;
      } else if (loserTotal < 33 && loserTricks === 0) {
        winnerGamePoints = 3;
      }
      return { winner, gamePoints: { p0: 0, p1: winnerGamePoints } };
    }
    if (state.hands.p1.length === 0) {
      const winner = 'p0' as const;
      const loserTotal = p1Total;
      const loserTricks = p1Tricks;
      let winnerGamePoints = 1;
      if (loserTotal < 33 && loserTricks >= 1) {
        winnerGamePoints = 2;
      } else if (loserTotal < 33 && loserTricks === 0) {
        winnerGamePoints = 3;
      }
      return { winner, gamePoints: { p0: winnerGamePoints, p1: 0 } };
    }
  }
  
  // Check if talon is closed and the closer failed to reach 66
  if (state.closed && state.closer !== null) {
    const closerTotal = state.closer === 'p0' ? p0Total : p1Total;
    if (closerTotal < 66 && state.talon.length === 0) {
      // Closer loses - opponent wins
      const winner = state.closer === 'p0' ? 'p1' : 'p0';
      const loser = winner === 'p0' ? 'p1' : 'p0';
      const loserTotal = loser === 'p0' ? p0Total : p1Total;
      const loserTricks = loser === 'p0' ? p0Tricks : p1Tricks;
      let winnerGamePoints = 1;
      if (loserTotal < 33 && loserTricks >= 1) {
        winnerGamePoints = 2;
      } else if (loserTotal < 33 && loserTricks === 0) {
        winnerGamePoints = 3;
      }
      return { winner, gamePoints: { p0: winner === 'p0' ? winnerGamePoints : 0, p1: winner === 'p1' ? winnerGamePoints : 0 } };
    }
  }
  
  return { winner: null, gamePoints: { p0: 0, p1: 0 } };
}

/**
 * Check if the game is over.
 * 
 * @param state - The current game state
 * @returns true if the game is over
 */
export function isGameOver(state: GameState): boolean {
  return getGameOutcome(state).winner !== null;
}
