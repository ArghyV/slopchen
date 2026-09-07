import { initializeGame, applyMove, getGameOutcome, isGameOver } from '../game';
import type { GameState, Card, GameMove } from '../types';

describe('game.ts', () => {
  describe('initializeGame', () => {
    it('should create a game with correct initial state', () => {
      const state = initializeGame('p0', 42);
      
      expect(state.dealer).toBe('p0');
      expect(state.currentPlayer).toBe('p1'); // Non-dealer plays first
      expect(state.leader).toBe('p1');
      expect(state.trick).toEqual([]);
      expect(state.closed).toBe(false);
      expect(state.closer).toBeNull();
      expect(state.turn).toBe(0);
      expect(state.history).toEqual([]);
      expect(state.winner).toBeNull();
      expect(state.points.p0).toBe(0);
      expect(state.points.p1).toBe(0);
      expect(state.melds.p0).toBe(0);
      expect(state.melds.p1).toBe(0);
      expect(state.tricks.p0).toBe(0);
      expect(state.tricks.p1).toBe(0);
    });

    it('should deal 5 cards to each player and 9 to talon + 1 trump card', () => {
      const state = initializeGame('p0', 42);
      
      expect(state.hands.p0.length).toBe(5);
      expect(state.hands.p1.length).toBe(5);
      expect(state.talon.length).toBe(9);
      expect(state.trumpCard).toBeDefined();
    });

    it('should have all 20 cards distributed', () => {
      const state = initializeGame('p0', 42);
      
      const allCards = [...state.hands.p0, ...state.hands.p1, ...state.talon, state.trumpCard!];
      expect(allCards.length).toBe(20);
      
      // Check no duplicates
      const uniqueCards = new Set(allCards);
      expect(uniqueCards.size).toBe(20);
    });

    it('should select a valid trump suit', () => {
      const suits = ['H', 'S', 'E', 'G'];
      const state = initializeGame('p0', 42);
      
      expect(suits).toContain(state.trump);
    });

    it('should use deterministic trump with seed', () => {
      const state1 = initializeGame('p0', 42);
      const state2 = initializeGame('p0', 42);
      
      expect(state1.trump).toBe(state2.trump);
    });

    it('should have unique game IDs', () => {
      const state1 = initializeGame('p0', 42);
      const state2 = initializeGame('p0', 43);
      
      expect(state1.id).not.toBe(state2.id);
    });

    it('should set p0 as current player when dealer is p1', () => {
      const state = initializeGame('p1', 42);
      
      expect(state.dealer).toBe('p1');
      expect(state.currentPlayer).toBe('p0');
      expect(state.leader).toBe('p0');
    });
  });

  describe('applyMove', () => {
    it('should apply play action and update state', () => {
      const state = initializeGame('p0', 42);
      const initialHandLength = state.hands.p1.length;
      const cardToPlay = state.hands.p1[0];
      
      const move: GameMove = {
        action: { type: 'play', card: cardToPlay, player: 'p1' },
        timestamp: Date.now()
      };
      
      const newState = applyMove(state, move);
      
      // Card should be removed from hand
      expect(newState.hands.p1.length).toBe(initialHandLength - 1);
      expect(newState.hands.p1).not.toContain(cardToPlay);
      
      // Card should be in trick
      expect(newState.trick).toContain(cardToPlay);
      
      // History should be updated
      expect(newState.history.length).toBe(1);
      expect(newState.history[0]).toEqual(move);
    });

    it('should resolve trick when second card is played', () => {
      const state = initializeGame('p0', 42);
      state.closed = true; // Close talon so suit-following is enforced
      state.trick = [];
      state.currentPlayer = 'p1';
      state.leader = 'p1';
      state.trumpCard = 'S10' as Card;
      // Give both players cards of the same suit
      state.hands.p1 = ['HA', 'H10', 'HK'] as Card[];
      state.hands.p0 = ['HO', 'HU', 'HQ'] as Card[];
      state.trump = 'S';
      state.points = { p0: 0, p1: 0 };
      state.melds = { p0: 0, p1: 0 };
      state.tricks = { p0: 0, p1: 0 };
      state.talon = [] as Card[];
      state.turn = 0;
      
      // p1 plays first card (HA - Hearts)
      const card1 = state.hands.p1[0];
      const move1: GameMove = {
        action: { type: 'play', card: card1, player: 'p1' },
        timestamp: Date.now()
      };
      let newState = applyMove(state, move1);
      
      // p0 plays second card (must follow suit - Hearts)
      const card2 = newState.hands.p0[0];
      const move2: GameMove = {
        action: { type: 'play', card: card2, player: 'p0' },
        timestamp: Date.now() + 1
      };
      newState = applyMove(newState, move2);
      
      // Trick should be resolved
      expect(newState.trick).toEqual([]);
      expect(newState.points.p0 + newState.points.p1).toBeGreaterThan(0);
    });

    it('should increment turn counter', () => {
      const state = initializeGame('p0', 42);
      const cardToPlay = state.hands.p1[0];
      
      const move: GameMove = {
        action: { type: 'play', card: cardToPlay, player: 'p1' },
        timestamp: Date.now()
      };
      
      const newState = applyMove(state, move);
      expect(newState.turn).toBe(1);
    });

    it('should throw error for illegal play', () => {
      const state = initializeGame('p0', 42);
      state.closed = true;
      state.trick = ['HA' as Card];
      state.leader = 'p0';
      state.currentPlayer = 'p1';
      state.trump = 'S';
      state.hands.p1 = ['SA', 'S10', 'SK'] as Card[];
      
      // Try to play SA when lead is HA and talon is closed
      // SA is Spades, lead is Hearts, trump is Spades
      // Player has Spades (trump) so must play Spades, but SA is Spades so it's legal
      // Let's change to a card that's not Spades
      state.hands.p1 = ['SA', 'S10', 'EA'] as Card[];
      
      const move: GameMove = {
        action: { type: 'play', card: 'EA' as Card, player: 'p1' },
        timestamp: Date.now()
      };
      
      expect(() => applyMove(state, move)).toThrow('Illegal play');
    });

    it('should throw error when not players turn', () => {
      const state = initializeGame('p0', 42);
      
      const move: GameMove = {
        action: { type: 'play', card: state.hands.p0[0], player: 'p0' },
        timestamp: Date.now()
      };
      
      // It's p1's turn, not p0's
      expect(() => applyMove(state, move)).toThrow("Not p0's turn");
    });
  });

  describe('getGameOutcome', () => {
    it('should return null when game is not over', () => {
      const state = initializeGame('p0', 42);
      
      const outcome = getGameOutcome(state);
      expect(outcome.winner).toBeNull();
    });

    it('should return p0 as winner when p0 has >= 66 points', () => {
      const state = initializeGame('p0', 42);
      state.points.p0 = 66;
      state.points.p1 = 40;
      state.tricks.p0 = 1;
      state.tricks.p1 = 1;
      
      const outcome = getGameOutcome(state);
      expect(outcome.winner).toBe('p0');
      // p1 has 40+ points, so normal win (1 point)
      expect(outcome.gamePoints.p0).toBe(1);
    });

    it('should return p1 as winner when p1 has >= 66 points', () => {
      const state = initializeGame('p0', 42);
      state.points.p0 = 40;
      state.points.p1 = 66;
      state.tricks.p0 = 1;
      state.tricks.p1 = 1;
      
      const outcome = getGameOutcome(state);
      expect(outcome.winner).toBe('p1');
      // p0 has 40+ points, so normal win (1 point)
      expect(outcome.gamePoints.p1).toBe(1);
    });

    it('should include meld points in total and award Schneider', () => {
      const state = initializeGame('p0', 42);
      state.points.p0 = 40;
      state.melds.p0 = 30;
      state.points.p1 = 0;
      state.melds.p1 = 0;
      state.tricks.p0 = 1;
      state.tricks.p1 = 0;
      
      const outcome = getGameOutcome(state);
      expect(outcome.winner).toBe('p0');
      // p1 has 0 points (< 33) and 0 tricks, so Schwarz (3 points)
      expect(outcome.gamePoints.p0).toBe(3);
    });

    it('should return p1 as winner when talon is empty and p0 has no cards', () => {
      const state = initializeGame('p0', 42);
      state.talon = [] as Card[];
      state.hands.p0 = [] as Card[];
      state.hands.p1 = ['HA', 'H10'] as Card[];
      state.points.p0 = 20;
      state.points.p1 = 30;
      state.tricks.p0 = 1;
      state.tricks.p1 = 2;
      
      const outcome = getGameOutcome(state);
      expect(outcome.winner).toBe('p1');
      expect(outcome.gamePoints.p1).toBeGreaterThan(0);
    });

    it('should return p0 as winner when talon is empty and p1 has no cards', () => {
      const state = initializeGame('p0', 42);
      state.talon = [] as Card[];
      state.hands.p0 = ['HA', 'H10'] as Card[];
      state.hands.p1 = [] as Card[];
      state.points.p0 = 30;
      state.points.p1 = 20;
      state.tricks.p0 = 2;
      state.tricks.p1 = 1;
      
      const outcome = getGameOutcome(state);
      expect(outcome.winner).toBe('p0');
      expect(outcome.gamePoints.p0).toBeGreaterThan(0);
    });
  });

  describe('isGameOver', () => {
    it('should return false when game is not over', () => {
      const state = initializeGame('p0', 42);
      expect(isGameOver(state)).toBe(false);
    });

    it('should return true when p0 has >= 66 points', () => {
      const state = initializeGame('p0', 42);
      state.points.p0 = 66;
      expect(isGameOver(state)).toBe(true);
    });

    it('should return true when talon is empty and p1 has no cards', () => {
      const state = initializeGame('p0', 42);
      state.talon = [] as Card[];
      state.hands.p1 = [] as Card[];
      expect(isGameOver(state)).toBe(true);
    });
  });
});
