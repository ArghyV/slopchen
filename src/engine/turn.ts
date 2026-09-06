import { getSuit, compareCards, type Card, type Suit } from './cards';
import { getTrickPoints } from './scoring';
import type { GameState } from './types';

/**
 * Resolve the current trick and update the game state.
 * 
 * Steps:
 * 1. Determines winner: highest trump card wins, or highest card of lead suit
 * 2. Winner takes all cards in trick
 * 3. Adds trick points to points[winner]
 * 4. Clears trick, sets leader = winner
 * 5. If talon is not closed/empty, both players draw 1 card
 * 6. Switches currentPlayer to winner
 * 
 * @param state - The current game state
 * @returns A new GameState after resolving the trick
 */
export function resolveTrick(state: GameState): GameState {
  if (state.trick.length !== 2) {
    throw new Error(`Cannot resolve trick with ${state.trick.length} cards`);
  }
  
  const leadSuit = getSuit(state.trick[0]);
  const leadCard = state.trick[0];
  const followCard = state.trick[1];
  
  // Determine winner by comparing the two cards
  const comparison = compareCards(leadCard, followCard, state.trump, leadSuit);
  const winner = comparison > 0 ? state.leader : state.currentPlayer;
  
  const newState = { ...state };
  
  // Add trick points to winner
  newState.points[winner] += getTrickPoints(newState.trick, newState.trump);
  
  // Clear trick
  newState.trick = [];
  
  // Set leader to winner
  newState.leader = winner;
  
  // Draw new cards if talon is not closed/empty
  if (!newState.closed && newState.talon.length > 0) {
    return drawCards(newState);
  }
  
  // Set current player to winner
  newState.currentPlayer = winner;
  newState.turn++;
  
  return newState;
}

/**
 * Draw cards for both players from the talon.
 * 
 * Each player draws one card, starting with the current player.
 * After drawing, currentPlayer is reset to the trick leader.
 * 
 * @param state - The current game state
 * @returns A new GameState after drawing cards
 */
export function drawCards(state: GameState): GameState {
  if (state.talon.length === 0) {
    return state;
  }
  
  const newState = { ...state };
  
  // Current player draws first
  const currentPlayerCard = newState.talon.pop();
  if (currentPlayerCard) {
    newState.hands[newState.currentPlayer].push(currentPlayerCard);
  }
  
  // Switch to other player
  const otherPlayer = newState.currentPlayer === 'p0' ? 'p1' : 'p0';
  
  // Other player draws
  const otherPlayerCard = newState.talon.pop();
  if (otherPlayerCard) {
    newState.hands[otherPlayer].push(otherPlayerCard);
  }
  
  // Reset current player to trick leader
  newState.currentPlayer = newState.leader;
  newState.turn++;
  
  return newState;
}
