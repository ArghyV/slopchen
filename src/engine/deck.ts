import { DECK, type Card } from './cards';

/**
 * Shuffle a deck of cards.
 * If seed is provided, uses deterministic shuffling via seedrandom.
 * Otherwise, uses Math.random for random shuffling.
 * @param seed - Optional seed for deterministic shuffling
 * @returns A shuffled copy of the DECK
 */
export function shuffleDeck(seed?: number): Card[] {
  const deck = [...DECK];
  
  if (seed !== undefined) {
    // Deterministic shuffle using seed
    // Use a simple seeded random number generator (Mulberry32)
    let currentSeed = seed;
    const random = () => {
      currentSeed += 0x6D2B79F5;
      let z = currentSeed;
      z = Math.imul(z ^ (z >>> 15), z | 1);
      z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
      return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
    };
    
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  } else {
    // Random shuffle using Fisher-Yates algorithm
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  
  return deck;
}

/**
 * Deal cards from a shuffled deck.
 * Deals 5 cards to each player (p0 and p1), and 10 cards to the talon.
 * @param deck - The shuffled deck (must have at least 20 cards)
 * @returns An object with hands for p0, p1, and the talon
 */
export function deal(deck: Card[]): { p0: Card[]; p1: Card[]; talon: Card[] } {
  if (deck.length < 20) {
    throw new Error(`Deck must have at least 20 cards, got ${deck.length}`);
  }
  
  const p0: Card[] = [];
  const p1: Card[] = [];
  const talon: Card[] = [];
  
  // Deal 5 cards to p0
  for (let i = 0; i < 5; i++) {
    p0.push(deck.pop()!);
  }
  
  // Deal 5 cards to p1
  for (let i = 0; i < 5; i++) {
    p1.push(deck.pop()!);
  }
  
  // Remaining 10 cards go to talon
  talon.push(...deck);
  
  return { p0, p1, talon };
}
