import { getSuit, getRank, isTrump, type Card, type Suit } from '../engine/cards';
import { getLegalMoves, canCloseTalon, canMeld, getMeldType } from '../engine/rules';
import { getTrickPoints } from '../engine/scoring';
import type { GameState, GameAction } from '../engine/types';

// Card rank order from lowest to highest
const CARD_RANK_ORDER: ('A' | '10' | 'K' | 'O' | 'U')[] = ['U', 'O', 'K', '10', 'A'];

/**
 * Weak AI implementation that makes deterministic decisions.
 * 
 * Priority order:
 * 1. Check for melds (marriages) - announce 40 or 20
 * 2. Check for close talon (fixed threshold: 50 points)
 * 3. Check for trump exchange (Unter for Ace)
 * 4. Play a card based on strategy
 * 
 * @param state - The current game state
 * @param player - The AI player (p0 or p1)
 * @returns The game action to take
 */
export function weakAI(state: GameState, player: 'p0' | 'p1'): GameAction {
  const hand = state.hands[player];
  
  // 1. Check for melds (marriages)
  const meldAction = tryMeld(state, player, hand);
  if (meldAction) return meldAction;
  
  // 2. Check for close talon (fixed threshold: 50 points)
  const closeAction = tryCloseTalon(state, player, hand);
  if (closeAction) return closeAction;
  
  // 3. Check for trump exchange
  const exchangeAction = tryExchange(state, player, hand);
  if (exchangeAction) return exchangeAction;
  
  // 4. Play a card
  return playCard(state, player, hand);
}

/**
 * Try to announce a meld (marriage) if possible.
 * 
 * @param state - The current game state
 * @param player - The AI player
 * @param hand - The player's hand
 * @returns Meld action if player can meld, null otherwise
 */
function tryMeld(state: GameState, player: 'p0' | 'p1', hand: Card[]): GameAction | null {
  if (state.leader !== player) return null;
  
  const meldType = getMeldType(state, player);
  if (meldType) {
    return { type: 'meld', meldType, player };
  }
  
  return null;
}

/**
 * Try to close the talon if possible.
 * 
 * @param state - The current game state
 * @param player - The AI player
 * @param hand - The player's hand
 * @returns Close talon action if player can close, null otherwise
 */
function tryCloseTalon(state: GameState, player: 'p0' | 'p1', hand: Card[]): GameAction | null {
  if (state.closed || state.leader !== player) return null;
  
  const playerPoints = state.points[player] + state.melds[player];
  const trickPoints = state.trick.length > 0 ? getTrickPoints(state.trick, state.trump) : 0;
  
  if (playerPoints + trickPoints >= 50) {
    return { type: 'close_talon', player };
  }
  
  return null;
}

/**
 * Try to exchange trump Unter for trump Ace if possible.
 * 
 * @param state - The current game state
 * @param player - The AI player
 * @param hand - The player's hand
 * @returns Exchange action if player can exchange, null otherwise
 */
function tryExchange(state: GameState, player: 'p0' | 'p1', hand: Card[]): GameAction | null {
  const trumpUnter = `${state.trump}U` as Card;
  const trumpAce = `${state.trump}A` as Card;
  
  if (hand.includes(trumpUnter) && !hand.includes(trumpAce)) {
    return { type: 'exchange', player };
  }
  
  return null;
}

/**
 * Play a card based on the AI's strategy.
 * 
 * Strategy:
 * - If leading (trick is empty):
 *   - Early game (points < 40): Lead lowest off-suit card
 *   - Late game (points >= 40): Lead highest card
 * - If following (trick has cards):
 *   - If talon closed: Play lowest card that wins, else lowest card
 *   - If talon open: Play lowest card
 * 
 * @param state - The current game state
 * @param player - The AI player
 * @param hand - The player's hand
 * @returns Play action with the card to play
 */
function playCard(state: GameState, player: 'p0' | 'p1', hand: Card[]): GameAction {
  const playerPoints = state.points[player] + state.melds[player];
  const isLeading = state.trick.length === 0;
  const leadSuit = isLeading ? null : getSuit(state.trick[0]);
  
  if (isLeading) {
    // Leading: prefer dumping low off-suit early, high cards late
    if (playerPoints < 40) {
      // Lead lowest off-suit (non-trump) card
      const offSuitCards = hand.filter(c => !isTrump(c, state.trump));
      if (offSuitCards.length > 0) {
        return { type: 'play', card: getLowestCard(offSuitCards), player };
      }
      // If no off-suit, lead lowest trump
      return { type: 'play', card: getLowestCard(hand), player };
    } else {
      // Lead highest card
      return { type: 'play', card: getHighestCard(hand, state.trump), player };
    }
  } else {
    // Following
    if (state.closed) {
      // Talon closed: must follow suit/trump
      const legalMoves = getLegalMoves(state, player);
      const winningCard = getLowestWinningCard(hand, state.trick, state.trump, leadSuit!);
      if (winningCard) {
        return { type: 'play', card: winningCard, player };
      }
      // Play lowest legal card
      return { type: 'play', card: getLowestCard(legalMoves), player };
    } else {
      // Talon open: play lowest card
      return { type: 'play', card: getLowestCard(hand), player };
    }
  }
}

/**
 * Get the lowest card in a list (by rank order).
 * 
 * @param cards - Array of cards
 * @returns The lowest card
 */
function getLowestCard(cards: Card[]): Card {
  return cards.sort((a, b) => {
    const rankA = getRank(a);
    const rankB = getRank(b);
    return CARD_RANK_ORDER.indexOf(rankA) - CARD_RANK_ORDER.indexOf(rankB);
  })[0];
}

/**
 * Get the highest card in a list (by rank order, trump first).
 * 
 * @param cards - Array of cards
 * @param trump - The current trump suit
 * @returns The highest card
 */
function getHighestCard(cards: Card[], trump: Suit): Card {
  return cards.sort((a, b) => {
    const aIsTrump = isTrump(a, trump);
    const bIsTrump = isTrump(b, trump);
    if (aIsTrump && !bIsTrump) return -1;
    if (!aIsTrump && bIsTrump) return 1;
    const rankA = getRank(a);
    const rankB = getRank(b);
    return CARD_RANK_ORDER.indexOf(rankB) - CARD_RANK_ORDER.indexOf(rankA);
  })[0];
}

/**
 * Get the lowest card that wins the current trick.
 * 
 * @param hand - The player's hand
 * @param trick - The current trick (first card is lead)
 * @param trump - The current trump suit
 * @param leadSuit - The suit of the lead card
 * @returns The lowest winning card, or null if no winning card
 */
function getLowestWinningCard(hand: Card[], trick: Card[], trump: Suit, leadSuit: Suit): Card | null {
  const leadCard = trick[0];
  
  const winningCards = hand.filter(c => {
    if (getSuit(c) !== leadSuit && !isTrump(c, trump)) return false;
    return compareCards(c, leadCard, trump, leadSuit) > 0;
  });
  
  if (winningCards.length === 0) return null;
  
  return winningCards.sort((a, b) => {
    return CARD_RANK_ORDER.indexOf(getRank(a)) - CARD_RANK_ORDER.indexOf(getRank(b));
  })[0];
}

/**
 * Compare two cards to determine which wins in a trick.
 * 
 * @param c1 - First card
 * @param c2 - Second card
 * @param trump - The current trump suit
 * @param leadSuit - The suit of the lead card
 * @returns > 0 if c1 beats c2, < 0 if c2 beats c1, 0 if equal
 */
function compareCards(c1: Card, c2: Card, trump: Suit, leadSuit: Suit): number {
  const s1 = getSuit(c1);
  const s2 = getSuit(c2);
  const isTrump1 = s1 === trump;
  const isTrump2 = s2 === trump;
  
  if (isTrump1 && !isTrump2) return 1;
  if (!isTrump1 && isTrump2) return -1;
  
  if (isTrump1 && isTrump2) {
    const rank1 = getRank(c1);
    const rank2 = getRank(c2);
    return CARD_RANK_ORDER.indexOf(rank1) - CARD_RANK_ORDER.indexOf(rank2);
  }
  
  if (s1 !== leadSuit || s2 !== leadSuit) {
    return 0; // Can't compare different non-trump suits
  }
  
  const rank1 = getRank(c1);
  const rank2 = getRank(c2);
  return CARD_RANK_ORDER.indexOf(rank1) - CARD_RANK_ORDER.indexOf(rank2);
}
