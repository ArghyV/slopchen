/**
 * StatusBar Component
 * Displays game status information
 */

import React from 'react';
import { Suit, TrumpSuit } from '../../../src/engine/cards';
import { Player } from '../types';
import { getSuitSymbol, SUIT_NAMES } from '../types';

interface StatusBarProps {
  points: Record<Player, number>;
  melds: Record<Player, number>;
  currentPlayer: Player;
  trump: TrumpSuit;
  closed: boolean;
  closer: Player | null;
  gameOver: boolean;
  winner: Player | null;
}

/**
 * StatusBar Component
 * Displays game state information including points, melds, trump, etc.
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  points,
  melds,
  currentPlayer,
  trump,
  closed,
  closer,
  gameOver,
  winner
}) => {
  // Calculate total points including melds
  const player1Total = points.p0 + melds.p0;
  const player2Total = points.p1 + melds.p1;

  // Determine who is leading
  const leader = player1Total > player2Total ? 'p0' : 
                player2Total > player1Total ? 'p1' : null;

  return (
    <div
      className="status-bar"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--spacing-3) var(--spacing-4)',
        backgroundColor: 'var(--color-surface)',
        borderBottom: 'var(--border-width-normal) solid var(--color-border)',
        fontFamily: 'var(--font-family)',
        flexWrap: 'wrap',
        gap: 'var(--spacing-3)',
      }}
      role="status"
      aria-live="polite"
    >
      {/* Player 1 (p0) Score */}
      <div
        className={`player-status p0 ${currentPlayer === 'p0' ? 'current' : ''} ${leader === 'p0' ? 'leading' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: '120px',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            fontWeight: 'var(--font-weight-medium)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          You
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: currentPlayer === 'p0' ? 'var(--color-primary)' : 'var(--color-text)',
          }}
        >
          {player1Total} pts
        </span>
        {melds.p0 > 0 && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-success)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            +{melds.p0} meld
          </span>
        )}
      </div>

      {/* Game Status Center */}
      <div
        className="game-status"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-1)',
        }}
      >
        {/* Trump Indicator */}
        <div
          className="trump-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
            backgroundColor: 'var(--suit-trump)',
            color: 'var(--color-surface)',
            padding: 'var(--spacing-1) var(--spacing-2)',
            borderRadius: 'var(--border-radius-0)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          <span>Trump:</span>
          <span style={{ fontSize: 'var(--font-size-lg)' }}>
            {getSuitSymbol(trump)}
          </span>
          <span>{SUIT_NAMES[trump]}</span>
        </div>

        {/* Game Phase */}
        <div
          className="phase-indicator"
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {gameOver ? (
            winner ? (
              <span style={{ color: winner === 'p0' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {winner === 'p0' ? 'You win!' : 'Opponent wins!'}
              </span>
            ) : 'Game Over'
          ) : closed ? (
            <span>
              Talon closed by {closer === 'p0' ? 'You' : 'Opponent'}
            </span>
          ) : (
            <span>
              {currentPlayer === 'p0' ? 'Your turn' : 'Opponent\'s turn'}
            </span>
          )}
        </div>
      </div>

      {/* Player 2 (p1) Score */}
      <div
        className={`player-status p1 ${currentPlayer === 'p1' ? 'current' : ''} ${leader === 'p1' ? 'leading' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minWidth: '120px',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            fontWeight: 'var(--font-weight-medium)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Opponent
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: currentPlayer === 'p1' ? 'var(--color-primary)' : 'var(--color-text)',
          }}
        >
          {player2Total} pts
        </span>
        {melds.p1 > 0 && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-success)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            +{melds.p1} meld
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
