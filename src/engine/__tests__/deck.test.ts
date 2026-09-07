import { shuffleDeck, deal } from '../deck';
import { DECK } from '../cards';

describe('deck.ts', () => {
  describe('shuffleDeck', () => {
    it('should return a copy of the deck', () => {
      const shuffled = shuffleDeck();
      expect(shuffled.length).toBe(DECK.length);
      expect(shuffled.sort()).toEqual(DECK.sort());
    });

    it('should return all 20 cards', () => {
      const shuffled = shuffleDeck();
      expect(shuffled.length).toBe(20);
    });

    it('should shuffle the deck randomly without seed', () => {
      const shuffled1 = shuffleDeck();
      const shuffled2 = shuffleDeck();
      // With different seeds (or no seed), shuffles should be different
      // Note: This test might occasionally fail due to randomness
      expect(shuffled1).not.toEqual(shuffled2);
    });

    it('should produce deterministic shuffle with seed', () => {
      const seed = 42;
      const shuffled1 = shuffleDeck(seed);
      const shuffled2 = shuffleDeck(seed);
      expect(shuffled1).toEqual(shuffled2);
    });

    it('should produce different shuffles with different seeds', () => {
      const shuffled1 = shuffleDeck(42);
      const shuffled2 = shuffleDeck(123);
      expect(shuffled1).not.toEqual(shuffled2);
    });

    it('should contain the same cards as original deck', () => {
      const shuffled = shuffleDeck(42);
      const originalSet = new Set(DECK);
      const shuffledSet = new Set(shuffled);
      expect(shuffledSet.size).toBe(originalSet.size);
      // Check all shuffled cards are in original deck
      shuffled.forEach(card => {
        expect(originalSet.has(card)).toBe(true);
      });
    });
  });

  describe('deal', () => {
    it('should deal 5 cards to each player and 9 to talon + 1 trump card', () => {
      const deck = [...DECK];
      const { p0, p1, talon, trumpCard } = deal(deck);
      
      expect(p0.length).toBe(5);
      expect(p1.length).toBe(5);
      expect(talon.length).toBe(9);
      expect(trumpCard).toBeDefined();
    });

    it('should deal all cards from the deck', () => {
      const deck = [...DECK];
      const { p0, p1, talon, trumpCard } = deal(deck);
      
      const allCards = [...p0, ...p1, ...talon, trumpCard];
      expect(allCards.length).toBe(20);
      expect(new Set(allCards).size).toBe(20);
    });

    it('should not overlap cards between players and talon', () => {
      const deck = [...DECK];
      const { p0, p1, talon } = deal(deck);
      
      const p0Set = new Set(p0);
      const p1Set = new Set(p1);
      const talonSet = new Set(talon);
      
      // Check no overlap between p0 and p1
      p0.forEach(card => {
        expect(p1Set.has(card)).toBe(false);
      });
      
      // Check no overlap between p0 and talon
      p0.forEach(card => {
        expect(talonSet.has(card)).toBe(false);
      });
      
      // Check no overlap between p1 and talon
      p1.forEach(card => {
        expect(talonSet.has(card)).toBe(false);
      });
    });

    it('should throw error if deck has fewer than 20 cards', () => {
      const shortDeck = DECK.slice(0, 10);
      expect(() => deal(shortDeck)).toThrow('Deck must have at least 20 cards');
    });

    it('should work with exactly 20 cards', () => {
      const deck = [...DECK];
      const { p0, p1, talon, trumpCard } = deal(deck);
      
      expect(p0.length).toBe(5);
      expect(p1.length).toBe(5);
      expect(talon.length).toBe(9);
      expect(trumpCard).toBeDefined();
    });

    it('should work with more than 20 cards', () => {
      const deck = [...DECK, ...DECK];
      const { p0, p1, talon, trumpCard } = deal(deck);
      
      expect(p0.length).toBe(5);
      expect(p1.length).toBe(5);
      expect(talon.length).toBe(29);
      expect(trumpCard).toBeDefined();
    });

    it('should use the last cards for dealing (pop from end)', () => {
      const deck = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10',
                    'C11', 'C12', 'C13', 'C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20'];
      const { p0, p1, talon, trumpCard } = deal(deck as any);
      
      // Last 5 cards should go to p0 (popped first)
      expect(p0).toEqual(['C20', 'C19', 'C18', 'C17', 'C16']);
      // Next 5 cards should go to p1
      expect(p1).toEqual(['C15', 'C14', 'C13', 'C12', 'C11']);
      // C10 is the trump card, rest go to talon
      expect(talon).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9']);
      expect(trumpCard).toBe('C10');
    });
  });
});
