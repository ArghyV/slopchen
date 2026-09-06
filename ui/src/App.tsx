/**
 * App Component
 * Main game container for Slopchen
 */

import React from 'react';
import { Card as CardType, Suit, TrumpSuit, getSuit, DECK } from '../../src/engine/cards';
import { initializeGame, applyMove, isGameOver, getGameOutcome, type GameState, type GameAction } from '../../src/engine/game';
import { getLegalMoves, canCloseTalon, canMeld, getMeldType } from '../../src/engine/rules';
import { weakAI } from '../../src/ai/weak';
import { Player, GamePhase, UIState } from './types';
import { Hand } from './components/Hand';
import { Talon } from './components/Talon';
import { Trick } from './components/Trick';
import { StatusBar } from './components/StatusBar';
import { ActionBar } from './components/ActionBar';
import './styles/globals.css';

/**
 * App Component
 * Main game container that manages game state and UI
 */
export const App: React.FC = () => {
  // Game state
  const [gameState, setGameState] = React.useState<GameState | null>(null);
  
  // UI state
  const [selectedCard, setSelectedCard] = React.useState<CardType | null>(null);
  const [phase, setPhase] = React.useState<GamePhase>('idle');
  const [error, setError] = React.useState<string | null>(null);
  
  // Initialize game on mount
  React.useEffect(() => {
    startNewGame();
  }, []);

  /**
   * Start a new game
   */
  const startNewGame = React.useCallback(() => {
    // Player is always p0, AI is p1
    const newGame = initializeGame('p0', 42); // Using fixed seed for deterministic gameplay
    setGameState(newGame);
    setSelectedCard(null);
    setPhase('waiting_for_player');
    setError(null);
  }, []);

  /**
   * Handle card selection
   */
  const handleCardSelect = React.useCallback((card: CardType) => {
    if (phase !== 'waiting_for_player' || gameState?.currentPlayer !== 'p0') return;
    
    setSelectedCard(prev => prev === card ? null : card);
  }, [phase, gameState?.currentPlayer]);

  /**
   * Handle card play
   */
  const handleCardPlay = React.useCallback((card: CardType) => {
    if (phase !== 'waiting_for_player' || gameState?.currentPlayer !== 'p0') return;
    
    const action: GameAction = {
      type: 'play',
      card,
      player: 'p0'
    };
    
    applyGameAction(action);
  }, [phase, gameState?.currentPlayer]);

  /**
   * Handle game action (meld, close talon, etc.)
   */
  const handleAction = React.useCallback((action: GameAction) => {
    if (phase !== 'waiting_for_player' || gameState?.currentPlayer !== 'p0') return;
    
    applyGameAction(action);
  }, [phase, gameState?.currentPlayer]);

  /**
   * Apply a game action and update state
   */
  const applyGameAction = React.useCallback((action: GameAction) => {
    if (!gameState) return;
    
    setPhase('ai_thinking');
    
    // Apply the action
    const move = {
      action,
      timestamp: Date.now()
    };
    
    const newState = applyMove(gameState, move);
    
    // Check if game is over
    if (isGameOver(newState)) {
      const outcome = getGameOutcome(newState);
      setGameState(newState);
      setPhase('game_over');
      setSelectedCard(null);
      return;
    }
    
    // Check if it's now the AI's turn
    if (newState.currentPlayer === 'p1') {
      // AI will make its move
      setTimeout(() => {
        const aiAction = weakAI(newState, 'p1');
        const aiMove = {
          action: aiAction,
          timestamp: Date.now()
        };
        const aiState = applyMove(newState, aiMove);
        
        // Check if game is over after AI move
        if (isGameOver(aiState)) {
          const outcome = getGameOutcome(aiState);
          setGameState(aiState);
          setPhase('game_over');
          setSelectedCard(null);
          return;
        }
        
        setGameState(aiState);
        setPhase('waiting_for_player');
        setSelectedCard(null);
      }, 1000); // AI thinking delay
      
      setGameState(newState);
      return;
    }
    
    // Player's turn again
    setGameState(newState);
    setPhase('waiting_for_player');
    setSelectedCard(null);
  }, [gameState]);

  /**
   * Get legal actions for the current player
   */
  const getLegalActions = React.useCallback((): GameAction[] => {
    if (!gameState) return [];
    
    const actions: GameAction[] = [];
    const player = gameState.currentPlayer;
    
    // Check for meld
    if (canMeld(gameState, player)) {
      const meldType = getMeldType(gameState, player);
      if (meldType) {
        actions.push({ type: 'meld', meldType, player });
      }
    }
    
    // Check for close talon
    if (canCloseTalon(gameState, player)) {
      actions.push({ type: 'close_talon', player });
    }
    
    // Check for exchange
    const hand = gameState.hands[player];
    const trumpUnter = `${gameState.trump}U` as CardType;
    const trumpAce = `${gameState.trump}A` as CardType;
    if (hand.includes(trumpUnter) && !hand.includes(trumpAce)) {
      actions.push({ type: 'exchange', player });
    }
    
    // Check for draw (if trick is complete and talon is open)
    if (gameState.trick.length === 2 && !gameState.closed && gameState.talon.length > 0) {
      actions.push({ type: 'draw', player });
    }
    
    // Get legal card plays
    const legalCards = getLegalMoves(gameState, player);
    for (const card of legalCards) {
      actions.push({ type: 'play', card, player });
    }
    
    return actions;
  }, [gameState]);

  /**
   * Get lead suit from current trick
   */
  const getLeadSuit = React.useCallback((): Suit | null => {
    if (!gameState || gameState.trick.length === 0) return null;
    return getSuit(gameState.trick[0]);
  }, [gameState]);

  /**
   * Get trick winner if trick is complete
   */
  const getTrickWinner = React.useCallback((): Player | null => {
    if (!gameState || gameState.trick.length !== 2) return null;
    
    // Simple comparison - first card is lead
    const leadCard = gameState.trick[0];
    const followCard = gameState.trick[1];
    const leadSuit = getSuit(leadCard);
    const trump = gameState.trump;
    
    const leadSuitIndex = gameState.trick.findIndex(c => getSuit(c) === leadSuit);
    const winnerIndex = leadSuitIndex === 0 ? 0 : 1;
    
    return winnerIndex === 0 ? 'p0' : 'p1';
  }, [gameState]);

  // Derive UI state from game state
  const isCurrentPlayer = gameState?.currentPlayer === 'p0';
  const isGameOverState = gameState ? isGameOver(gameState) : false;
  const outcome = gameState ? getGameOutcome(gameState) : null;

  // Error boundary
  if (error) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-error)',
        fontFamily: 'var(--font-family)',
      }}>
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={startNewGame} style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-surface)',
          border: 'none',
          borderRadius: 'var(--border-radius-0)',
          cursor: 'pointer',
        }}>
          New Game
        </button>
      </div>
    );
  }

  // Loading state
  if (!gameState) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        fontFamily: 'var(--font-family)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--color-text)',
        }}>
          <h1 style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: 'var(--color-primary)',
          }}>
            Slopchen
          </h1>
          <p>Initializing game...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-background)',
      fontFamily: 'var(--font-family)',
    }}>
      {/* Status Bar */}
      <StatusBar
        points={gameState.points}
        melds={gameState.melds}
        currentPlayer={gameState.currentPlayer}
        trump={gameState.trump}
        closed={gameState.closed}
        closer={gameState.closer}
        gameOver={isGameOverState}
        winner={outcome?.winner || null}
      />

      {/* Main Game Area */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto auto auto 1fr',
        gap: 'var(--spacing-3)',
        padding: 'var(--spacing-3)',
        alignContent: 'center',
      }}>
        {/* Opponent Hand (hidden) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
          <Hand
            cards={gameState.hands.p1}
            trump={gameState.trump}
            selectedCard={null}
            currentPlayer={gameState.currentPlayer}
            player="p1"
            gameState={gameState}
            onCardSelect={() => {}}
            onCardPlay={() => {}}
            isCurrentPlayer={false}
          />
        </div>

        {/* Trick Area */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Trick
            cards={gameState.trick}
            trump={gameState.trump}
            leadSuit={getLeadSuit()}
            winner={getTrickWinner()}
            currentPlayer={gameState.currentPlayer}
          />
        </div>

        {/* Talon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Talon
            cards={gameState.talon}
            isClosed={gameState.closed}
            trump={gameState.trump}
          />
        </div>

        {/* Player Hand */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}>
          <Hand
            cards={gameState.hands.p0}
            trump={gameState.trump}
            selectedCard={selectedCard}
            currentPlayer={gameState.currentPlayer}
            player="p0"
            gameState={gameState}
            onCardSelect={handleCardSelect}
            onCardPlay={handleCardPlay}
            isCurrentPlayer={isCurrentPlayer}
          />
        </div>
      </main>

      {/* Action Bar */}
      <ActionBar
        legalActions={getLegalActions()}
        currentPlayer={gameState.currentPlayer}
        gameState={gameState}
        onAction={handleAction}
        phase={phase}
      />

      {/* Game Over Overlay */}
      {isGameOverState && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            padding: '2rem',
            borderRadius: 'var(--border-radius-0)',
            border: 'var(--border-width-normal) solid var(--color-border)',
            maxWidth: '400px',
          }}>
            <h2 style={{
              fontSize: 'var(--font-size-xl)',
              marginBottom: '1rem',
              color: outcome?.winner === 'p0' ? 'var(--color-success)' : 'var(--color-error)',
            }}>
              {outcome?.winner === 'p0' ? 'You Win!' : 'Opponent Wins!'}
            </h2>
            <p style={{
              fontSize: 'var(--font-size-base)',
              marginBottom: '1rem',
              color: 'var(--color-text)',
            }}>
              Final Score: {gameState.points.p0 + gameState.melds.p0} - {gameState.points.p1 + gameState.melds.p1}
            </p>
            <button
              onClick={startNewGame}
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-surface)',
                border: 'none',
                borderRadius: 'var(--border-radius-0)',
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
