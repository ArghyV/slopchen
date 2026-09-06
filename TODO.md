# TODO / Known Issues

Found during manual review (no human has audited this codebase against the
real rules of Schnapsen before now — this list is a starting point, not a
complete audit).

## Engine — critical, rules-breaking

- [ ] **Wrong player draws from the talon after a trick** (`src/engine/turn.ts`,
      `resolveTrick`). The winner is computed but `currentPlayer` is never set
      to the winner before `drawCards` runs, so `drawCards` draws for
      whoever played *second* in the trick instead of whoever *won* it.
      Verified empirically: leader wins a trick, but the follower still draws
      the top talon card first. Should be: trick winner always draws first.

- [ ] **`canCloseTalon` enforces a fake "50 points to close" rule**
      (`src/engine/rules.ts`). Real Schnapsen has no point requirement to
      close the talon — either player can close on their lead at any time,
      as a risk decision. The tests currently assert the 50-point gate, so
      fixing this means updating `rules.test.ts` too, not just the code.

- [ ] **No penalty for closing the talon and failing to reach 66**
      (`src/engine/game.ts`, `getGameOutcome`). This is the actual
      counterbalance to closing early — currently unimplemented. Closing
      the talon has no real consequence in-engine right now.

- [ ] **No Schneider/Schwarz game-point scoring.** `getGameOutcome` returns
      raw card point totals; real Schnapsen scores the hand as 1/2/3 game
      points depending on the loser's points and whether they took a trick.

- [ ] **Trump exchange can read/mutate the opponent's hidden hand**
      (`src/engine/game.ts`, exchange logic). Falls back to swapping with
      `state.hands[opponent]` if the trump Ace isn't in the talon — this
      isn't a real rule (exchange is only ever against the face-up card
      under the talon) and leaks hidden information through the shared
      `GameState` object. Also missing preconditions entirely: should
      require it being the exchanging player's lead, talon open, and talon
      non-empty.

- [ ] **No modeled "trump card"** — `initializeGame` picks trump as an
      independent random suit and deals all 10 remaining cards face-down
      into the talon. Real Schnapsen turns up one specific card as the
      trump indicator (kept visible under the talon); that specific card is
      what's exchangeable, not "whichever copy of the trump Ace happens to
      still be undrawn."

## Engine — smaller

- [ ] `compareCards` is duplicated between `src/engine/cards.ts` and
      `src/ai/weak.ts` with different (inconsistent) tie-breaking behavior
      for incomparable suits — one throws, one returns `0`.
- [ ] `estimateTrickPoints` (a fuzzy heuristic) is used inside
      `canCloseTalon`, a legality check — legality should be exact, not
      estimated.
- [ ] No README/docstrings existed before this pass explaining any of the
      above — this file plus the new `README.md` are the first written
      account of what's implemented vs. what's real Schnapsen.

## UI — critical

- [ ] **Opponent's hand is rendered face-up.** `Hand.tsx` hardcodes
      `isFaceUp={true}` for every hand regardless of which player it
      belongs to — `Card.tsx` supports face-down rendering fine (see
      `Talon.tsx` for a correct example), `Hand.tsx` just never uses it.
      As shipped, you can see the AI's exact cards at all times.
- [ ] **Every new game deals identical cards.** `App.tsx`'s `startNewGame`
      hardcodes `initializeGame('p0', 42)` — fixed seed on every click of
      "New Game." Looks like a leftover debug value.
- [ ] **Trick-winner banner always says `p0` won.** `getTrickWinner()` in
      `App.tsx` computes `leadSuit` from `trick[0]` and then checks whether
      `trick[0]`'s suit equals `leadSuit` — which is true by construction,
      so the function always returns `'p0'`. UI-only bug (doesn't affect
      actual scoring), but the win banner/highlight is wrong whenever `p1`
      actually wins a trick.
- [ ] **"Player 1 / Player 2" trick labels can be swapped.** `Trick.tsx`
      labels `trick[0]` as "Player 1" unconditionally, but `trick[0]` is
      whichever player led that trick, which alternates hand to hand.

## UI — smaller

- [ ] `Hand.tsx` computes legal-move highlighting using the `currentPlayer`
      prop instead of `player` (the hand's actual owner) — harmless today
      only because the opponent hand isn't interactive.
- [ ] `ActionBar.tsx` injects a `<style>` tag into `document.head` as a
      module-level side effect instead of via CSS/`useEffect`.
- [ ] `Hand` and `ActionBar` type `gameState`/`onAction` props as `any`
      instead of the real engine types (`GameState`/`GameAction`), which
      already exist and are used elsewhere.
- [ ] Inline style objects are used pervasively instead of the CSS files
      already set up under `ui/src/styles/` — inconsistent with itself,
      not wrong on its own.

## Missing features (not bugs, just not built yet)

- [ ] No "strong" AI at all — no determinization/PIMC search, no
      card-probability tracking, no perfect-information endgame solver for
      the closed-talon phase.
- [ ] No adjustable/real difficulty settings, no opponent modeling.
