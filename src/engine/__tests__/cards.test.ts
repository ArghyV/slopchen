import { 
  getSuit, 
  getRank, 
  isTrump, 
  compareCards,
  DECK,
  CARD_POINTS
} from '../cards';

describe('cards.ts', () => {
  describe('DECK', () => {
    it('should have 20 cards', () => {
      expect(DECK.length).toBe(20);
    });

    it('should contain all suits', () => {
      const suits = ['H', 'S', 'E', 'G'];
      suits.forEach(suit => {
        const suitCards = DECK.filter(c => c[0] === suit);
        expect(suitCards.length).toBe(5);
      });
    });

    it('should contain all ranks', () => {
      const ranks = ['A', '10', 'K', 'O', 'U'];
      ranks.forEach(rank => {
        const rankCards = DECK.filter(c => c.slice(1) === rank);
        expect(rankCards.length).toBe(4);
      });
    });
  });

  describe('CARD_POINTS', () => {
    it('should have correct point values', () => {
      expect(CARD_POINTS.A).toBe(11);
      expect(CARD_POINTS['10']).toBe(10);
      expect(CARD_POINTS.K).toBe(4);
      expect(CARD_POINTS.O).toBe(3);
      expect(CARD_POINTS.U).toBe(2);
    });
  });

  describe('getSuit', () => {
    it('should return the first character as suit', () => {
      expect(getSuit('HA')).toBe('H');
      expect(getSuit('S10')).toBe('S');
      expect(getSuit('EK')).toBe('E');
      expect(getSuit('GO')).toBe('G');
      expect(getSuit('HU')).toBe('H');
    });
  });

  describe('getRank', () => {
    it('should return the rank part of the card', () => {
      expect(getRank('HA')).toBe('A');
      expect(getRank('S10')).toBe('10');
      expect(getRank('EK')).toBe('K');
      expect(getRank('GO')).toBe('O');
      expect(getRank('HU')).toBe('U');
    });
  });

  describe('isTrump', () => {
    it('should return true when card suit matches trump', () => {
      expect(isTrump('HA', 'H')).toBe(true);
      expect(isTrump('H10', 'H')).toBe(true);
      expect(isTrump('HK', 'H')).toBe(true);
    });

    it('should return false when card suit does not match trump', () => {
      expect(isTrump('HA', 'S')).toBe(false);
      expect(isTrump('S10', 'H')).toBe(false);
      expect(isTrump('EK', 'G')).toBe(false);
    });
  });

  describe('compareCards', () => {
    const trump = 'H';

    describe('trump vs non-trump', () => {
      it('should return 1 when first card is trump and second is not', () => {
        expect(compareCards('HA', 'SA', trump, 'H')).toBeGreaterThan(0);
        expect(compareCards('HU', 'SA', trump, 'H')).toBeGreaterThan(0);
      });

      it('should return -1 when first card is not trump and second is', () => {
        expect(compareCards('SA', 'HA', trump, 'S')).toBeLessThan(0);
        expect(compareCards('S10', 'HU', trump, 'S')).toBeLessThan(0);
      });
    });

    describe('both trump', () => {
      it('should correctly order trump cards by rank (U < O < K < 10 < A)', () => {
        // U < O
        expect(compareCards('HU', 'HO', trump, 'H')).toBeLessThan(0);
        expect(compareCards('HO', 'HU', trump, 'H')).toBeGreaterThan(0);

        // O < K
        expect(compareCards('HO', 'HK', trump, 'H')).toBeLessThan(0);
        expect(compareCards('HK', 'HO', trump, 'H')).toBeGreaterThan(0);

        // K < 10
        expect(compareCards('HK', 'H10', trump, 'H')).toBeLessThan(0);
        expect(compareCards('H10', 'HK', trump, 'H')).toBeGreaterThan(0);

        // 10 < A
        expect(compareCards('H10', 'HA', trump, 'H')).toBeLessThan(0);
        expect(compareCards('HA', 'H10', trump, 'H')).toBeGreaterThan(0);
      });

      it('should handle transitive comparisons', () => {
        // U < A
        expect(compareCards('HU', 'HA', trump, 'H')).toBeLessThan(0);
        // O < A
        expect(compareCards('HO', 'HA', trump, 'H')).toBeLessThan(0);
        // K < A
        expect(compareCards('HK', 'HA', trump, 'H')).toBeLessThan(0);
        // 10 < A
        expect(compareCards('H10', 'HA', trump, 'H')).toBeLessThan(0);
      });
    });

    describe('both non-trump, same suit', () => {
      it('should correctly order non-trump cards by rank', () => {
        const leadSuit = 'S';

        // U < O
        expect(compareCards('SU', 'SO', trump, leadSuit)).toBeLessThan(0);
        expect(compareCards('SO', 'SU', trump, leadSuit)).toBeGreaterThan(0);

        // O < K
        expect(compareCards('SO', 'SK', trump, leadSuit)).toBeLessThan(0);
        expect(compareCards('SK', 'SO', trump, leadSuit)).toBeGreaterThan(0);

        // K < 10
        expect(compareCards('SK', 'S10', trump, leadSuit)).toBeLessThan(0);
        expect(compareCards('S10', 'SK', trump, leadSuit)).toBeGreaterThan(0);

        // 10 < A
        expect(compareCards('S10', 'SA', trump, leadSuit)).toBeLessThan(0);
        expect(compareCards('SA', 'S10', trump, leadSuit)).toBeGreaterThan(0);
      });
    });

    describe('different non-trump suits', () => {
      it('should throw error when comparing cards of different non-trump suits', () => {
        expect(() => compareCards('SA', 'EK', trump, 'S')).toThrow();
        expect(() => compareCards('S10', 'GA', trump, 'S')).toThrow();
      });
    });

    describe('edge cases', () => {
      it('should return 0 for identical cards (though this should not happen in game)', () => {
        expect(compareCards('HA', 'HA', trump, 'H')).toBe(0);
      });
    });
  });
});
