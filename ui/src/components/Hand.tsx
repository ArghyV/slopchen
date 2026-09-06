/**
 * Hand Component
 * Renders a player's hand of cards
 */

import React from 'react';
import { Card as CardType, Suit, TrumpSuit } from '../../../src/engine/cards';
import { getLegalMoves } from '../../../src/engine/rules';
import { Player } from '../types';
import { Card } from './Card';

interface HandProps {
  cards: CardType[];
  trump: TrumpSuit;
  selectedCard: CardType | null;
  currentPlayer: Player;
  player: Player;
  gameState: any; // GameState from engine
  onCardSelect: (card: CardType) => void;
  onCardPlay: (card: CardType) => void;
  isCurrentPlayer: boolean;
}

/**
 * Hand Component
 * Displays a player's hand and handles card selection and playing
 */
export const Hand: React.FC<HandProps> = ({
  cards,
  trump,
  selectedCard,
  currentPlayer,
  player,
  gameState,
  onCardSelect,
  onCardPlay,
  isCurrentPlayer
}) => {
  // Get legal moves for the current player
  const legalMoves = gameState ? getLegalMoves(gameState, currentPlayer) : cards;
  
  // Determine which cards are disabled (not legal to play)
  const disabledCards = new Set(
    cards.filter(card => !legalMoves.includes(card))
  );

  const handleCardClick = React.useCallback((card: CardType) => {
    if (!isCurrentPlayer) return;
    
    const isDisabled = disabledCards.has(card);
    
    if (isDisabled) return;
    
    // If card is already selected, play it
    if (selectedCard === card) {
      onCardPlay(card);
      return;
    }
    
    // Select the card
    onCardSelect(card);
  }, [selectedCard, isCurrentPlayer, disabledCards, onCardSelect, onCardPlay]);

  // Sort cards by suit and rank for consistent display
  const sortedCards = React.useMemo(() => {
    const suitOrder: Suit[] = ['H', 'S', 'E', 'G'];
    const rankOrder: string[] = ['U', 'O', 'K', '10', 'A'];
    
    return [...cards].sort((a, b) => {
      const aSuit = a[0] as Suit;
      const bSuit = b[0] as Suit;
      const aRank = a.slice(1);
      const bRank = b.slice(1);
      
      const suitDiff = suitOrder.indexOf(aSuit) - suitOrder.indexOf(bSuit);
      if (suitDiff !== 0) return suitDiff;
      
      return rankOrder.indexOf(aRank) - rankOrder.indexOf(bRank);
    });
  }, [cards]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div 
      className={`hand player-${player} ${isCurrentPlayer ? 'current-player' : ''}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '0.25rem',
        padding: '0.5rem',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {sortedCards.map((card) => (
        <Card
          key={card}
          card={card}
          trump={trump}
          isSelected={selectedCard === card}
          isDisabled={disabledCards.has(card) && isCurrentPlayer}
          isFaceUp={true}
          onClick={handleCardClick}
          className={`in-hand ${selectedCard === card ? 'selected' : ''}`}
          style={{
            flexShrink: 0,
            cursor: isCurrentPlayer && !disabledCards.has(card) ? 'pointer' : 'default',
          }}
        />
      ))}
    </div>
  );
};

export default Hand;
