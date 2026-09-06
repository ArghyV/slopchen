import { resolveTrick, drawCards } from '../turn';
import { initializeGame } from '../game';
import type { GameState, Card } from '../types';

describe('turn.ts', () => {
  let state: GameState;

  beforeEach(() => {
    state = initializeGame('p0', 42);
  });

  describe('resolveTrick', () => {
    it('should throw error when trick has less than 2 cards', () => {
      state.trick = ['HA' as Card];
      expect(() => resolveTrick(state)).toThrow('Cannot resolve trick with 1 cards');
    });

    it('should throw error when trick has more than 2 cards', () => {
      state.trick = ['HA', 'H10', 'HK'] as Card[];
      expect(() => resolveTrick(state)).toThrow('Cannot resolve trick with 3 cards');
    });

    it('should determine winner based on card comparison', () => {
      state.trick = ['HA', 'H10'] as Card[];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'H';
      
      // HA (11 points, rank A) should beat H10 (10 points, rank 10)
      // In Schnapsen, A > 10, so HA should win
      const result = resolveTrick(state);
      
      // Leader (p0) played HA, currentPlayer (p1) played H10
      // HA beats H10, so p0 should win
      expect(result.leader).toBe('p0');
      expect(result.trick).toEqual([]);
      expect(result.points.p0).toBeGreaterThan(0);
    });

    it('should award trick points to winner', () => {
      state.trick = ['HA', 'H10'] as Card[];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'H';
      state.points.p0 = 0;
      state.points.p1 = 0;
      
      const result = resolveTrick(state);
      
      // HA (11) + H10 (10) = 21 points
      expect(result.points.p0).toBe(21);
      expect(result.points.p1).toBe(0);
    });

    it('should draw cards when talon is not closed and not empty', () => {
      state.trick = ['HA', 'H10'] as Card[];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'H';
      state.closed = false;
      state.talon = ['SA', 'S10', 'SK', 'SO', 'SU', 'EA', 'E10'] as Card[];
      state.hands.p0 = ['HK', 'HO'] as Card[];
      state.hands.p1 = ['HU', 'GA'] as Card[];
      
      const result = resolveTrick(state);
      
      // Winner should be p0 (HA beats H10)
      expect(result.leader).toBe('p0');
      
      // Both players should have drawn a card
      expect(result.hands.p0.length).toBe(3); // Had 2, drew 1
      expect(result.hands.p1.length).toBe(3); // Had 2, drew 1
      expect(result.talon.length).toBe(5); // Had 7, 2 drawn
      expect(result.currentPlayer).toBe('p0'); // Reset to leader
    });

    it('should not draw cards when talon is closed', () => {
      state.trick = ['HA', 'H10'] as Card[];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'H';
      state.closed = true;
      state.talon = ['SA', 'S10', 'SK'] as Card[];
      state.hands.p0 = ['HK', 'HO'] as Card[];
      state.hands.p1 = ['HU', 'GA'] as Card[];
      
      const result = resolveTrick(state);
      
      // No cards should be drawn
      expect(result.hands.p0.length).toBe(2);
      expect(result.hands.p1.length).toBe(2);
      expect(result.talon.length).toBe(3);
    });

    it('should not draw cards when talon is empty', () => {
      state.trick = ['HA', 'H10'] as Card[];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'H';
      state.closed = false;
      state.talon = [] as Card[];
      state.hands.p0 = ['HK', 'HO'] as Card[];
      state.hands.p1 = ['HU', 'GA'] as Card[];
      
      const result = resolveTrick(state);
      
      // No cards should be drawn
      expect(result.hands.p0.length).toBe(2);
      expect(result.hands.p1.length).toBe(2);
      expect(result.talon.length).toBe(0);
    });

    it('should handle trump cards correctly', () => {
      state.trick = ['SA', 'HA'] as Card[];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'H';
      state.points.p0 = 0;
      state.points.p1 = 0;
      
      // HA is trump, SA is not, so HA should win
      const result = resolveTrick(state);
      
      expect(result.leader).toBe('p1');
      expect(result.points.p1).toBe(11 + 11); // SA (11) + HA (11)
    });
  });

  describe('drawCards', () => {
    it('should return same state when talon is empty', () => {
      state.talon = [] as Card[];
      state.currentPlayer = 'p0';
      state.leader = 'p0';
      state.hands.p0 = ['HA', 'H10'] as Card[];
      state.hands.p1 = ['HK', 'HO'] as Card[];
      
      const result = drawCards(state);
      
      expect(result).toEqual(state);
    });

    it('should draw one card for each player', () => {
      state.talon = ['SA', 'S10', 'SK', 'SO', 'SU'] as Card[];
      state.currentPlayer = 'p0';
      state.leader = 'p0';
      state.hands.p0 = ['HA', 'H10'] as Card[];
      state.hands.p1 = ['HK', 'HO'] as Card[];
      
      const result = drawCards(state);
      
      expect(result.hands.p0.length).toBe(3);
      expect(result.hands.p1.length).toBe(3);
      expect(result.talon.length).toBe(3);
      expect(result.currentPlayer).toBe('p0'); // Reset to leader
    });

    it('should draw from end of talon', () => {
      state.talon = ['C1', 'C2', 'C3', 'C4', 'C5'] as any as Card[];
      state.currentPlayer = 'p0';
      state.leader = 'p0';
      state.hands.p0 = [] as Card[];
      state.hands.p1 = [] as Card[];
      
      const result = drawCards(state);
      
      // Current player (p0) should get C5, other player (p1) should get C4
      expect(result.hands.p0).toEqual(['C5'] as any as Card[]);
      expect(result.hands.p1).toEqual(['C4'] as any as Card[]);
      expect(result.talon).toEqual(['C1', 'C2', 'C3'] as any as Card[]);
    });

    it('should handle odd number of cards in talon', () => {
      state.talon = ['C1', 'C2', 'C3'] as any as Card[];
      state.currentPlayer = 'p0';
      state.leader = 'p0';
      state.hands.p0 = [] as Card[];
      state.hands.p1 = [] as Card[];
      
      const result = drawCards(state);
      
      // Current player (p0) should get C3, other player (p1) should get C2
      expect(result.hands.p0).toEqual(['C3'] as any as Card[]);
      expect(result.hands.p1).toEqual(['C2'] as any as Card[]);
      expect(result.talon).toEqual(['C1'] as any as Card[]);
    });

    it('should increment turn counter', () => {
      state.talon = ['C1', 'C2'] as any as Card[];
      state.currentPlayer = 'p0';
      state.leader = 'p0';
      state.turn = 5;
      state.hands.p0 = [] as Card[];
      state.hands.p1 = [] as Card[];
      
      const result = drawCards(state);
      
      expect(result.turn).toBe(6);
    });
  });
});
