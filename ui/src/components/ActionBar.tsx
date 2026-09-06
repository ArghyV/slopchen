/**
 * ActionBar Component
 * Displays available game actions (meld, close talon, etc.)
 */

import React from 'react';
import { Card as CardType, TrumpSuit } from '../../../src/engine/cards';
import { getLegalMoves, canCloseTalon, canMeld, getMeldType } from '../../../src/engine/rules';
import { Player, GamePhase, UIAction } from '../types';

interface ActionBarProps {
  legalActions: any[]; // GameAction[] from engine
  currentPlayer: Player;
  gameState: any;
  onAction: (action: any) => void;
  phase: GamePhase;
}

/**
 * ActionBar Component
 * Displays available actions for the current player
 */
export const ActionBar: React.FC<ActionBarProps> = ({
  legalActions,
  currentPlayer,
  gameState,
  onAction,
  phase
}) => {
  // Convert legal actions to UI actions with labels
  const uiActions = React.useMemo<UIAction[]>(() => {
    const actions: UIAction[] = [];

    for (const action of legalActions) {
      switch (action.type) {
        case 'meld':
          actions.push({
            action,
            label: `Announce ${action.meldType}`,
            primary: true,
          });
          break;
        case 'close_talon':
          actions.push({
            action,
            label: 'Close Talon',
            primary: true,
          });
          break;
        case 'exchange':
          actions.push({
            action,
            label: 'Exchange Jack',
            primary: false,
          });
          break;
        case 'draw':
          actions.push({
            action,
            label: 'Draw Card',
            primary: false,
          });
          break;
        default:
          // Skip play actions as they're handled by card clicks
          break;
      }
    }

    return actions;
  }, [legalActions]);

  // Check if AI is thinking
  const isAIThinking = phase === 'ai_thinking';

  // Check if it's the AI's turn
  const isAITurn = currentPlayer === 'p1';

  // Show AI thinking indicator
  if (isAIThinking || isAITurn) {
    return (
      <div
        className="action-bar ai-turn"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--spacing-3)',
          backgroundColor: 'var(--color-background)',
          borderTop: 'var(--border-width-normal) solid var(--color-border)',
        }}
      >
        <div
          className="ai-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
          }}
        >
          <div
            className="spinner"
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Opponent is thinking...
          </span>
        </div>
      </div>
    );
  }

  // No actions available
  if (uiActions.length === 0) {
    return (
      <div
        className="action-bar empty"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--spacing-3)',
          backgroundColor: 'var(--color-background)',
          borderTop: 'var(--border-width-normal) solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-family)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Play a card or select an action
        </span>
      </div>
    );
  }

  return (
    <div
      className="action-bar"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
        padding: 'var(--spacing-3)',
        backgroundColor: 'var(--color-background)',
        borderTop: 'var(--border-width-normal) solid var(--color-border)',
        flexWrap: 'wrap',
      }}
    >
      {uiActions.map((uiAction, index) => (
        <ActionButton
          key={index}
          action={uiAction}
          onClick={() => onAction(uiAction.action)}
          disabled={phase !== 'waiting_for_player'}
        />
      ))}
    </div>
  );
};

/**
 * ActionButton Component
 * A styled button for game actions
 */
interface ActionButtonProps {
  action: UIAction;
  onClick: () => void;
  disabled: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  onClick,
  disabled
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      style={{
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        padding: 'var(--spacing-2) var(--spacing-4)',
        borderRadius: 'var(--border-radius-0)',
        border: 'var(--border-width-normal) solid var(--color-border)',
        backgroundColor: action.primary 
          ? 'var(--color-primary)' 
          : 'var(--color-surface)',
        color: action.primary 
          ? 'var(--color-surface)' 
          : 'var(--color-text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all var(--transition-fast) ease',
        whiteSpace: 'nowrap',
      }}
      aria-label={action.label}
      aria-disabled={disabled}
    >
      {action.label}
    </button>
  );
};

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default ActionBar;
