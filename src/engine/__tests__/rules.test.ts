import { getLegalMoves, isLegalPlay, canCloseTalon, canMeld, getMeldType } from '../rules';
import { initializeGame } from '../game';
import type { GameState } from '../types';

describe('rules.ts', () => {
  let state: GameState;

  beforeEach(() => {
    // Create a fresh game state for each test
    state = initializeGame('p0', 42);
  });

  describe('getLegalMoves', () => {
    it('should return all cards when leading (trick is empty)', () => {
      const hand = state.hands.p0;
      const legalMoves = getLegalMoves(state, 'p0');
      expect(legalMoves.sort()).toEqual(hand.sort());
    });

    it('should return all cards when talon is open and following', () => {
      // Simulate a trick being started
      state.trick = ['HA'];
      state.currentPlayer = 'p1';
      
      const hand = state.hands.p1;
      const legalMoves = getLegalMoves(state, 'p1');
      expect(legalMoves.sort()).toEqual(hand.sort());
    });

    it('should return only suit cards when talon is closed and following same suit', () => {
      state.closed = true;
      state.trick = ['HA'];
      state.currentPlayer = 'p1';
      
      // Add a known hand for testing
      state.hands.p1 = ['SA', 'S10', 'SK', 'H10', 'HK'];
      
      const legalMoves = getLegalMoves(state, 'p1');
      // Should only return hearts (same as lead suit)
      expect(legalMoves.every(c => c[0] === 'H')).toBe(true);
      expect(legalMoves).toContain('H10');
      expect(legalMoves).toContain('HK');
      expect(legalMoves).not.toContain('SA');
      expect(legalMoves).not.toContain('S10');
      expect(legalMoves).not.toContain('SK');
    });

    it('should return trump cards when no suit cards available and talon closed', () => {
      state.closed = true;
      state.trump = 'H';
      state.trick = ['SA'];
      state.currentPlayer = 'p1';
      
      // Player has no Spades, but has Hearts (trump)
      state.hands.p1 = ['HA', 'H10', 'HK', 'EA', 'EK'];
      
      const legalMoves = getLegalMoves(state, 'p1');
      // Should only return trump cards (Hearts)
      expect(legalMoves.every(c => c[0] === 'H')).toBe(true);
      expect(legalMoves).toContain('HA');
      expect(legalMoves).toContain('H10');
      expect(legalMoves).toContain('HK');
    });

    it('should return all cards when no suit or trump cards available and talon closed', () => {
      state.closed = true;
      state.trump = 'H';
      state.trick = ['SA'];
      state.currentPlayer = 'p1';
      
      // Player has no Spades and no Hearts
      state.hands.p1 = ['EA', 'EK', 'GA', 'GK', 'GO'];
      
      const legalMoves = getLegalMoves(state, 'p1');
      // Should return all cards
      expect(legalMoves.sort()).toEqual(state.hands.p1.sort());
    });
  });

  describe('isLegalPlay', () => {
    it('should return true for any card when leading', () => {
      const hand = state.hands.p0;
      hand.forEach(card => {
        expect(isLegalPlay(state, card, 'p0')).toBe(true);
      });
    });

    it('should return true for legal follow card', () => {
      state.trick = ['HA'];
      state.currentPlayer = 'p1';
      state.hands.p1 = ['SA', 'S10', 'H10', 'HK', 'SK'];
      
      // H10 is same suit as lead (H)
      expect(isLegalPlay(state, 'H10', 'p1')).toBe(true);
      expect(isLegalPlay(state, 'HK', 'p1')).toBe(true);
    });

    it('should return false for illegal follow card when talon closed and player has suit cards', () => {
      state.closed = true;
      state.trick = ['HA'];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'S';
      state.hands.p1 = ['SA', 'S10', 'SK', 'EA', 'EK'];
      
      // Player has Spades (SA, S10, SK) which is NOT the lead suit (H)
      // But player also has no Hearts, and trump is S
      // So player must play Spades (trump), not Diamonds or Acorns
      expect(isLegalPlay(state, 'EA' as any, 'p1')).toBe(false);
      expect(isLegalPlay(state, 'EK' as any, 'p1')).toBe(false);
    });

    it('should return true for trump card when no suit cards available and talon closed', () => {
      state.closed = true;
      state.trick = ['SA'];
      state.currentPlayer = 'p1';
      state.trump = 'H';
      state.hands.p1 = ['HA', 'H10', 'HK', 'EA', 'EK'];
      
      // HA is trump
      expect(isLegalPlay(state, 'HA', 'p1')).toBe(true);
      expect(isLegalPlay(state, 'H10', 'p1')).toBe(true);
      expect(isLegalPlay(state, 'HK', 'p1')).toBe(true);
    });
  });

  describe('canCloseTalon', () => {
    it('should return false when talon is already closed', () => {
      state.closed = true;
      state.leader = 'p0';
      
      expect(canCloseTalon(state, 'p0')).toBe(false);
    });

    it('should return false when player is not leader', () => {
      state.leader = 'p1';
      
      expect(canCloseTalon(state, 'p0')).toBe(false);
    });

    it('should return true when player is leader and talon is open', () => {
      state.leader = 'p0';
      state.points.p0 = 0;
      state.melds.p0 = 0;
      
      expect(canCloseTalon(state, 'p0')).toBe(true);
    });

    it('should return true when player is leader with any points', () => {
      state.leader = 'p0';
      state.points.p0 = 10;
      state.melds.p0 = 0;
      
      expect(canCloseTalon(state, 'p0')).toBe(true);
    });
  });

  describe('canMeld', () => {
    it('should return false when player is not leader', () => {
      state.leader = 'p1';
      state.hands.p0 = ['HK', 'HO', 'HA', 'H10', 'HU'];
      
      expect(canMeld(state, 'p0')).toBe(false);
    });

    it('should return true when player has King and Ober of trump suit and is leader', () => {
      state.leader = 'p0';
      state.trump = 'H';
      state.hands.p0 = ['HK', 'HO', 'HA', 'H10', 'HU'];
      
      expect(canMeld(state, 'p0')).toBe(true);
    });

    it('should return true when player has King and Ober of non-trump suit and is leader', () => {
      state.leader = 'p0';
      state.trump = 'H';
      state.hands.p0 = ['SK', 'SO', 'HA', 'H10', 'HU'];
      
      expect(canMeld(state, 'p0')).toBe(true);
    });

    it('should return false when player has only King without Ober', () => {
      state.leader = 'p0';
      state.hands.p0 = ['HK', 'HA', 'H10', 'HU', 'HO'];
      state.hands.p0 = ['HK', 'HA', 'H10', 'HU', 'SA'];
      
      expect(canMeld(state, 'p0')).toBe(false);
    });

    it('should return false when player has only Ober without King', () => {
      state.leader = 'p0';
      state.hands.p0 = ['HO', 'HA', 'H10', 'HU', 'SA'];
      
      expect(canMeld(state, 'p0')).toBe(false);
    });
  });

  describe('getMeldType', () => {
    it('should return null when player is not leader', () => {
      state.leader = 'p1';
      state.hands.p0 = ['HK', 'HO', 'HA', 'H10', 'HU'];
      
      expect(getMeldType(state, 'p0')).toBeNull();
    });

    it('should return 40 when player has King and Ober of trump suit', () => {
      state.leader = 'p0';
      state.trump = 'H';
      state.hands.p0 = ['HK', 'HO', 'HA', 'H10', 'HU'];
      
      expect(getMeldType(state, 'p0')).toBe('40');
    });

    it('should return 20 when player has King and Ober of non-trump suit', () => {
      state.leader = 'p0';
      state.trump = 'H';
      state.hands.p0 = ['SK', 'SO', 'HA', 'H10', 'HU'];
      
      expect(getMeldType(state, 'p0')).toBe('20');
    });

    it('should return 40 when player has both trump and non-trump marriages', () => {
      state.leader = 'p0';
      state.trump = 'H';
      state.hands.p0 = ['HK', 'HO', 'SK', 'SO', 'HU'];
      
      // Should prefer trump marriage (40) over non-trump (20)
      expect(getMeldType(state, 'p0')).toBe('40');
    });

    it('should return null when player has no marriage', () => {
      state.leader = 'p0';
      state.hands.p0 = ['HA', 'H10', 'HU', 'SA', 'S10'];
      
      expect(getMeldType(state, 'p0')).toBeNull();
    });
  });
});
