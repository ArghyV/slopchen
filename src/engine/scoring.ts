import { getRank, type Card, type TrumpSuit } from './cards';
import type { GameState } from './types';

// Card point values
const CARD_POINTS: Record<'A' | '10' | 'K' | 'O' | 'U', number> = {
  A: 11, '10': 10, K: 4, O: 3, U: 2
};

/**
 * Calculate the total points in a trick.
 * 
 * @param trick - Array of cards in the trick
 * @param trump - The current trump suit (not used in point calculation, just for API consistency)
 * @returns Total points in the trick
 */
export function getTrickPoints(trick: Card[], trump: TrumpSuit): number {
  return trick.reduce((sum, card) => {
    const rank = getRank(card);
    return sum + CARD_POINTS[rank];
  }, 0);
}

/**
 * Get the points for a meld announcement.
 * 
 * @param meldType - '20' for non-trump marriage, '40' for trump marriage
 * @returns The point value of the meld
 */
export function getMeldPoints(meldType: '20' | '40'): number {
  return meldType === '20' ? 20 : 40;
}
