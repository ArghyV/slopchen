import { getTrickPoints, getMeldPoints } from '../scoring';
import type { Card } from '../cards';

describe('scoring.ts', () => {
  describe('getTrickPoints', () => {
    it('should return 0 for empty trick', () => {
      expect(getTrickPoints([], 'H')).toBe(0);
    });

    it('should return correct points for single card', () => {
      expect(getTrickPoints(['HA' as Card], 'H')).toBe(11);
      expect(getTrickPoints(['H10' as Card], 'H')).toBe(10);
      expect(getTrickPoints(['HK' as Card], 'H')).toBe(4);
      expect(getTrickPoints(['HO' as Card], 'H')).toBe(3);
      expect(getTrickPoints(['HU' as Card], 'H')).toBe(2);
    });

    it('should return sum of points for multiple cards', () => {
      const trick = ['HA', 'H10', 'HK', 'HO', 'HU'] as Card[];
      expect(getTrickPoints(trick, 'H')).toBe(11 + 10 + 4 + 3 + 2);
    });

    it('should work with different suits', () => {
      const trick = ['SA', 'S10', 'EA', 'E10'] as Card[];
      expect(getTrickPoints(trick, 'H')).toBe(11 + 10 + 11 + 10);
    });

    it('should return correct points for all ranks in one suit', () => {
      const trick = ['GA', 'G10', 'GK', 'GO', 'GU'] as Card[];
      expect(getTrickPoints(trick, 'H')).toBe(11 + 10 + 4 + 3 + 2);
    });

    it('should return correct points for mixed suits', () => {
      const trick = ['HA', 'S10', 'EK', 'GO', 'HU'] as Card[];
      expect(getTrickPoints(trick, 'H')).toBe(11 + 10 + 4 + 3 + 2);
    });
  });

  describe('getMeldPoints', () => {
    it('should return 20 for meldType 20', () => {
      expect(getMeldPoints('20')).toBe(20);
    });

    it('should return 40 for meldType 40', () => {
      expect(getMeldPoints('40')).toBe(40);
    });
  });
});
