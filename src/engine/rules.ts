import { getSuit, isTrump, type Card, type Suit } from './cards';
import type { GameState } from './types';

/**
 * Get all legal cards a player can play in the current game state.
 * 
 * Rules:
 * 1. If trick.length === 0 (leading): Any card in hand.
 * 2. If trick.length > 0 (following):
 *    - If talon is closed: Must follow suit if possible, else must follow trump if possible.
 *    - If talon is open: Can play any card (no suit/trump requirement).
 * 
 * @param state - The current game state
 * @param player - The player to get legal moves for
 * @returns Array of legal cards the player can play
 */
export function getLegalMoves(state: GameState, player: 'p0' | 'p1'): Card[] {
  const hand = state.hands[player];
  
  // If leading (trick is empty), can play any card
  if (state.trick.length === 0) {
    return [...hand];
  }
  
  // If talon is open, can play any card
  if (!state.closed) {
    return [...hand];
  }
  
  // Talon is closed: must follow suit or trump
  const leadCard = state.trick[0];
  const leadSuit = getSuit(leadCard);
  
  // Check if player has any cards of the lead suit
  const handInSuit = hand.filter(c => getSuit(c) === leadSuit);
  if (handInSuit.length > 0) {
    return handInSuit;
  }
  
  // No cards in lead suit, check for trump cards
  const handInTrump = hand.filter(c => isTrump(c, state.trump));
  if (handInTrump.length > 0) {
    return handInTrump;
  }
  
  // No cards in lead suit or trump: can play any card
  return [...hand];
}

/**
 * Check if playing a specific card is legal in the current game state.
 * 
 * @param state - The current game state
 * @param card - The card to check
 * @param player - The player attempting to play the card
 * @returns true if the play is legal, false otherwise
 */
export function isLegalPlay(state: GameState, card: Card, player: 'p0' | 'p1'): boolean {
  const legalMoves = getLegalMoves(state, player);
  return legalMoves.includes(card);
}

/**
 * Check if a player can close the talon.
 * 
 * Rules:
 * - Player must be the current leader (state.leader === player)
 * - Talon must not already be closed
 * - Either player can close on their lead at any time (no point requirement)
 * 
 * @param state - The current game state
 * @param player - The player attempting to close
 * @returns true if the player can close the talon
 */
export function canCloseTalon(state: GameState, player: 'p0' | 'p1'): boolean {
  return !state.closed && state.leader === player;
}

/**
 * Check if a player can announce a meld (marriage).
 * 
 * Rules:
 * - Player must be the current leader (state.leader === player)
 * - Player must have King and Ober of a suit
 * - Can announce 40 if trump suit, 20 otherwise
 * 
 * @param state - The current game state
 * @param player - The player attempting to meld
 * @returns true if the player can announce a meld
 */
export function canMeld(state: GameState, player: 'p0' | 'p1'): boolean {
  if (state.leader !== player) {
    return false;
  }
  
  const hand = state.hands[player];
  const suits: Suit[] = ['H', 'S', 'E', 'G'];
  
  for (const suit of suits) {
    const hasKing = hand.some(c => getSuit(c) === suit && c.slice(1) === 'K');
    const hasOber = hand.some(c => getSuit(c) === suit && c.slice(1) === 'O');
    if (hasKing && hasOber) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the meld type a player can announce (20 or 40).
 * 
 * @param state - The current game state
 * @param player - The player attempting to meld
 * @returns '20' or '40' if player can meld, null otherwise
 */
export function getMeldType(state: GameState, player: 'p0' | 'p1'): '20' | '40' | null {
  if (state.leader !== player) {
    return null;
  }
  
  const hand = state.hands[player];
  const suits: Suit[] = ['H', 'S', 'E', 'G'];
  
  // Check for trump marriage first (40 points)
  const hasTrumpKing = hand.some(c => getSuit(c) === state.trump && c.slice(1) === 'K');
  const hasTrumpOber = hand.some(c => getSuit(c) === state.trump && c.slice(1) === 'O');
  if (hasTrumpKing && hasTrumpOber) {
    return '40';
  }
  
  // Check for non-trump marriage (20 points)
  for (const suit of suits) {
    if (suit === state.trump) continue;
    const hasKing = hand.some(c => getSuit(c) === suit && c.slice(1) === 'K');
    const hasOber = hand.some(c => getSuit(c) === suit && c.slice(1) === 'O');
    if (hasKing && hasOber) {
      return '20';
    }
  }
  
  return null;
}
