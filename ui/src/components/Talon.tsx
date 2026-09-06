/**
 * Talon Component
 * Renders the draw pile (talon)
 */

import React from 'react';
import { Card as CardType, TrumpSuit } from '../../../src/engine/cards';
import { Card } from './Card';

interface TalonProps {
  cards: CardType[];
  isClosed: boolean;
  trump: TrumpSuit;
  onClick?: () => void;
}

/**
 * Talon Component
 * Displays the draw pile with remaining card count
 */
export const Talon: React.FC<TalonProps> = ({
  cards,
  isClosed,
  trump,
  onClick
}) => {
  const cardCount = cards.length;

  if (cardCount === 0) {
    return null;
  }

  // Show only the top card (face down)
  const visibleCards = [cards[0]];

  return (
    <div
      className={`talon ${isClosed ? 'closed' : 'open'}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : -1}
      aria-label={`Talon: ${cardCount} cards remaining, ${isClosed ? 'closed' : 'open'}`}
    >
      <div
        style={{
          display: 'flex',
          gap: '-2rem', // Overlap cards slightly
        }}
      >
        {visibleCards.map((card, index) => (
          <Card
            key={index}
            card={card}
            trump={trump}
            isSelected={false}
            isDisabled={true}
            isFaceUp={false}
            className="in-talon"
            style={{
              zIndex: cardCount - index,
              marginLeft: `${index * 16}px`,
            }}
          />
        ))}
      </div>
      
      {/* Card count indicator */}
      <div
        className="talon-count"
        style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--spacing-1) var(--spacing-2)',
          borderRadius: 'var(--border-radius-0)',
          border: 'var(--border-width-thin) solid var(--color-border)',
        }}
      >
        {cardCount} cards
      </div>
      
      {/* Closed indicator */}
      {isClosed && (
        <div
          className="talon-closed-indicator"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              color: 'var(--color-surface)',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '0 0 4px var(--color-border)',
            }}
          >
            CLOSED
          </span>
        </div>
      )}
    </div>
  );
};

export default Talon;
