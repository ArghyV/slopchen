// Traditional German suits: Herz (H), Schellen (S), Eichel (E), Grün (G)
// Ranks: Ass (A), Zehn (10), König (K), Ober (O), Unter (U)

export type Suit = 'H' | 'S' | 'E' | 'G';
export type Rank = 'A' | '10' | 'K' | 'O' | 'U';
export type Card = `${Suit}${Rank}`;

// Predefined deck (20 cards)
export const DECK: Card[] = [
  // Hearts (Herz)
  'HA', 'H10', 'HK', 'HO', 'HU',
  // Bells (Schellen)
  'SA', 'S10', 'SK', 'SO', 'SU',
  // Acorns (Eichel)
  'EA', 'E10', 'EK', 'EO', 'EU',
  // Leaves (Grün)
  'GA', 'G10', 'GK', 'GO', 'GU'
];

// Card values (points)
export const CARD_POINTS: Record<Rank, number> = {
  A: 11, '10': 10, K: 4, O: 3, U: 2
};

// Trump suit (dynamic, set randomly at game start)
export type TrumpSuit = Suit;

// Card rank order from lowest to highest
// In Schnapsen: U < O < K < 10 < A (within same suit)
const CARD_RANK_ORDER: Rank[] = ['U', 'O', 'K', '10', 'A'];

/**
 * Extract the suit from a card.
 * @param card - The card string (e.g., "HA", "S10")
 * @returns The suit character
 */
export function getSuit(card: Card): Suit {
  return card[0] as Suit;
}

/**
 * Extract the rank from a card.
 * @param card - The card string (e.g., "HA", "S10")
 * @returns The rank string
 */
export function getRank(card: Card): Rank {
  const suit = getSuit(card);
  return card.slice(1) as Rank;
}

/**
 * Check if a card is a trump card.
 * @param card - The card to check
 * @param trump - The current trump suit
 * @returns true if the card's suit matches the trump suit
 */
export function isTrump(card: Card, trump: TrumpSuit): boolean {
  return getSuit(card) === trump;
}

/**
 * Compare two cards to determine which wins in a trick.
 * @param c1 - First card
 * @param c2 - Second card
 * @param trump - The current trump suit
 * @param leadSuit - The suit of the first card played in the trick
 * @returns > 0 if c1 beats c2, < 0 if c2 beats c1, 0 if equal (shouldn't happen)
 */
export function compareCards(c1: Card, c2: Card, trump: TrumpSuit, leadSuit: Suit): number {
  const s1 = getSuit(c1);
  const s2 = getSuit(c2);
  const isTrump1 = s1 === trump;
  const isTrump2 = s2 === trump;

  // If one is trump and the other isn't, trump wins
  if (isTrump1 && !isTrump2) return 1;
  if (!isTrump1 && isTrump2) return -1;
  
  // Both are trump or both are non-trump
  if (isTrump1 && isTrump2) {
    // Both trump: compare by rank order
    const rank1 = getRank(c1);
    const rank2 = getRank(c2);
    return CARD_RANK_ORDER.indexOf(rank1) - CARD_RANK_ORDER.indexOf(rank2);
  }
  
  // Neither is trump: must be same suit as lead to compare
  if (s1 !== leadSuit || s2 !== leadSuit) {
    throw new Error(`Cannot compare cards of different non-trump suits: ${c1} vs ${c2}`);
  }
  
  // Same non-trump suit: compare by rank
  const rank1 = getRank(c1);
  const rank2 = getRank(c2);
  return CARD_RANK_ORDER.indexOf(rank1) - CARD_RANK_ORDER.indexOf(rank2);
}
