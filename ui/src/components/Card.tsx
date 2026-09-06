/**
 * Card Component
 * Renders a single playing card with 1960s Swiss design
 */

import React from 'react';
import { Card as CardType, Suit, TrumpSuit } from '../../../src/engine/cards';
import { getSuitColour, getRankSymbol, getSuitSymbol } from '../types';
import '../styles/Card.css';

interface CardProps {
  card: CardType;
  trump: TrumpSuit;
  isSelected: boolean;
  isDisabled: boolean;
  isFaceUp: boolean;
  onClick?: (card: CardType) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Get the display class for a suit
 */
function getSuitClass(suit: Suit): string {
  return `suit-${suit}`;
}

/**
 * Get the rank display value
 */
function getRankDisplay(rank: string): string {
  const symbols: Record<string, string> = {
    A: 'A',
    '10': '10',
    K: 'K',
    O: 'O',
    U: 'U'
  };
  return symbols[rank] || rank;
}

/**
 * Card Component
 * Displays a card with suit and rank
 */
export const Card: React.FC<CardProps> = ({
  card,
  trump,
  isSelected = false,
  isDisabled = false,
  isFaceUp = true,
  onClick,
  className = '',
  style = {}
}) => {
  const suit = card[0] as Suit;
  const rank = card.slice(1);
  const isTrump = suit === trump;
  
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDisabled || !onClick) return;
    onClick(card);
  }, [card, isDisabled, onClick]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  }, [handleClick]);

  // Build class list
  const classes = [
    'card',
    getSuitClass(suit),
    isSelected ? 'selected' : '',
    isDisabled ? 'disabled' : '',
    isTrump ? 'trump' : '',
    isFaceUp ? 'face-up' : 'face-down',
    className
  ].filter(Boolean).join(' ');

  if (!isFaceUp) {
    return (
      <div
        className={classes}
        style={style}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-label="Card back"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className="card-back" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={classes}
      style={style}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`${getRankDisplay(rank)} of ${suit}`}
      aria-disabled={isDisabled}
      aria-selected={isSelected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Card face with corners */}
      <div className="card-face">
        {/* Top-left corner */}
        <div className="card-corner" style={{ color: isTrump ? getSuitColour(trump) : getSuitColour(suit) }}>
          <span className="card-rank">{getRankDisplay(rank)}</span>
          <span className="card-suit">{getSuitSymbol(suit)}</span>
        </div>
        
        {/* Bottom-right corner */}
        <div className="card-corner bottom" style={{ color: isTrump ? getSuitColour(trump) : getSuitColour(suit) }}>
          <span className="card-rank">{getRankDisplay(rank)}</span>
          <span className="card-suit">{getSuitSymbol(suit)}</span>
        </div>
        
        {/* Center content */}
        <div className="card-center" style={{ color: isTrump ? getSuitColour(trump) : getSuitColour(suit) }}>
          <span className="rank">{getRankDisplay(rank)}</span>
          <span className="suit">{getSuitSymbol(suit)}</span>
        </div>
      </div>
    </div>
  );
};

export default Card;
