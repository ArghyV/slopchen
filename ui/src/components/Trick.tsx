/**
 * Trick Component
 * Renders the current trick (cards played in the current round)
 */

import React from 'react';
import { Card as CardType, Suit, TrumpSuit } from '../../../src/engine/cards';
import { Player } from '../types';
import { Card } from './Card';

interface TrickProps {
  cards: CardType[];
  trump: TrumpSuit;
  leadSuit: Suit | null;
  winner?: Player;
  currentPlayer?: Player;
}

/**
 * Trick Component
 * Displays the cards played in the current trick
 */
export const Trick: React.FC<TrickProps> = ({
  cards,
  trump,
  leadSuit,
  winner,
  currentPlayer
}) => {
  if (cards.length === 0) {
    return (
      <div
        className="trick empty"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '120px',
          minWidth: '200px',
          border: 'var(--border-width-thin) dashed var(--color-border-light)',
          borderRadius: 'var(--border-radius-0)',
        }}
        aria-label="Empty trick area"
      >
        <span
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Play a card to start trick
        </span>
      </div>
    );
  }

  // Determine card positions based on number of cards
  const getCardPosition = (index: number): React.CSSProperties => {
    const positions = [
      // 1 card (just played)
      { transform: 'translateX(0)' },
      // 2 cards (both players have played)
      { transform: 'translateX(-50px)' },
      { transform: 'translateX(50px)' },
    ];
    return positions[index] || {};
  };

  return (
    <div
      className="trick"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        minHeight: '120px',
        minWidth: '200px',
        position: 'relative',
      }}
      aria-label={`Trick: ${cards.length} cards played`}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          className={`trick-slot player-${index === 0 ? 'p0' : 'p1'}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            ...getCardPosition(index),
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Player label */}
          <span
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            {index === 0 ? 'Leader' : 'Follower'}
          </span>
          
          <Card
            card={card}
            trump={trump}
            isSelected={false}
            isDisabled={true}
            isFaceUp={true}
            className="in-trick"
          />
        </div>
      ))}
      
      {/* Winner indicator */}
      {winner && cards.length === 2 && (
        <div
          className="trick-winner"
          style={{
            position: 'absolute',
            bottom: '-1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: winner === 'p0' ? 'var(--color-success)' : 'var(--color-error)',
            color: 'var(--color-surface)',
            padding: 'var(--spacing-1) var(--spacing-3)',
            borderRadius: 'var(--border-radius-0)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-bold)',
          }}
        >
          {winner === 'p0' ? 'You win!' : 'Opponent wins!'} trick
        </div>
      )}
      
      {/* Lead suit indicator */}
      {leadSuit && (
        <div
          className="lead-suit-indicator"
          style={{
            position: 'absolute',
            top: '-1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            padding: 'var(--spacing-1) var(--spacing-2)',
            borderRadius: 'var(--border-radius-0)',
            border: 'var(--border-width-thin) solid var(--color-border)',
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          Lead: {leadSuit}
        </div>
      )}
    </div>
  );
};

export default Trick;
