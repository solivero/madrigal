---
name: madrigal
description: Use when working with Madrigal's game-rules code (game/src/*.ts), debugging card effects, writing rules tests, explaining gameplay to the user, or building bots / running simulations. Covers board layout, the 14 card types, turn flow, scoring stack, known bugs, and how to verify changes via tests / sim / browser preview.
---

# Madrigal — game-rules skill

A 2-player turn-based card game in the spirit of Gwent / "kortspelet". Three packages:

- `@madrigal/core` (`game/src/*.ts`) — pure rules. **Never depends on UI.**
- `@madrigal/server` — boardgame.io WebSocket + lobby (Koa)
- `@madrigal/frontend` — React 18 + Vite + Tailwind v4 + Framer Motion

## Board

Each player has a **3 × 7** half-board (`board.rows = 3`, `board.cols = 7`):

```
col:    0       1   2   3   4   5     6
       ┌────┬───┬───┬───┬───┬───┬────┐
row 0  │ N  │ G │ G │ G │ G │ G │ N  │   green row
row 1  │ N  │ B │ B │ B │ B │ B │ N  │   blue  row
row 2  │ N  │ R │ R │ R │ R │ R │ N  │   red   row
       └────┴───┴───┴───┴───┴───┴────┘
        ^                            ^
        side / effect slot           side / effect slot
        (Standard, Fog, Jester)      (Standard, Fog, Jester)
```

- Color slots (cols 1–5) accept cards whose `color` matches the row's `rowColor`, **or** any **gold** card (which can go on any row).
- Neutral side slots (col 0, col 6) accept **effect cards** — Standard (flag), Fog, Jester. The flag colour must match the row colour (or be gold).
- The whole match has two half-boards stacked: opponent above, current player below. `cardSlots` is a flat array of length 21 per player, indexed `row*cols + col`.

## Turn flow

Defined in `game/src/game.ts`.

- **Phases:** `game1 → game2 → game3` (best-of-3).
- A phase ends when **both** players have `passed === true` (`bothPassed`). On `onEnd`, the higher-points player wins that game (`assignGameWin`, `games += 1`). The match ends when one player reaches `games === 2` (`endIf`).
- On each `turn.onBegin` the engine recomputes every card's points via `addBuffs(P0) → addBuffs(P1) → countPlayerPoints(P0) → countPlayerPoints(P1)`. The order matters: buffs are applied before totals.

### Stages (`ctx.activePlayers[player]`)

| Stage                       | Allowed moves                                  | Set by                              |
| --------------------------- | ---------------------------------------------- | ----------------------------------- |
| `default`                   | `playCardFromHand`, `pass`                     | start of turn                       |
| `graveyardOwn`              | `selectGraveyardCard` (own graveyard only)     | Thief / Priest `onPlace`            |
| `graveyardBoth`             | `selectGraveyardCard` (either graveyard)       | Spy `onPlace`                       |
| `selectBoardCardOwn`        | `playCardFromBoard` (own → own)                | Field Marshal                       |
| `selectBoardCardOpponent`   | `playCardFromBoard` (opponent → own)           | Merchant                            |

## The 14 cards (mirror of `cards.ts`)

| Name            | Pts | Hero | Colors      | Effect (short)                                                                 |
| --------------- | --- | ---- | ----------- | ------------------------------------------------------------------------------ |
| Spy             | 1   |      | g/b/r/gold  | Place opp side; draw from either graveyard. Else placed on own with no effect. |
| Thief           | 2   |      | g/b/r/gold  | Place opp side; draw 2 from own graveyard.                                     |
| Fisherman       | 3   |      | g/b/r/gold  | Draw top of deck.                                                              |
| Farmer          | 4   |      | g/b/r/gold  | Buffs heroes & priests on own side. n farmers = +n each.                       |
| Smith           | 5   |      | g/b/r/gold  | +1 to every non-priest card in the same row.                                   |
| Merchant        | 6   |      | g/b/r/gold  | Steal any card from opponent (triggers `selectBoardCardOpponent`).             |
| Priest          | 7   | ✓    | g/b/r/gold  | Draw from own graveyard or deck.                                               |
| Warrior         | 8   |      | g/b/r/gold  | No effect.                                                                     |
| Field marshal   | 9   |      | g/b/r/gold  | Move any of your cards (triggers `selectBoardCardOwn`).                        |
| Treasurer       | 10  | ✓    | g/b/r/gold  | Hero baseline (no extra effect; immune to buffs/effects).                      |
| Queen           | 11  | ✓    | g/b/r/gold  | Hero baseline.                                                                 |
| King            | 12  | ✓    | g/b/r/gold  | Hero baseline.                                                                 |
| **Standard**    | 13  | ✓    | g/b/r/gold  | Played as 13-point hero, **or** as a flag in a row's side slot to double row.  |
| Fog             | 0   | ✓    | g/b/r/gold  | Side slot only. Zeroes points on the same-color row (excl. heroes).            |
| Jester          | 0   | ✓    | g/b/r/gold  | Side slot only. Resets all cards in its row to `basePoints`.                   |

The card name `"Standard"` (in code) ≡ the "flag" in tooltips. Watch for this — there's a known bug where the code looks for `"Flag"` instead. See **`game/BUGS.md`**.

## Scoring stack (what `addBuffs` actually does)

For each card in each slot (`construct.ts::addBuffs::determinePoints`):

1. **If** the slot is a neutral side slot AND the card is a Standard ⇒ points = 0, effects = {} (flag itself contributes no row points).
2. **If** a Jester is in the same row's effect slots ⇒ points = basePoints, effects = `{ jester: 0 }`. (Jester short-circuits everything else.)
3. Compute three buff numbers via lookup:
   - `smith = getSmithBuff` — +1 per smith in same row, non-priests only.
   - `farmer = getFarmerBuff` — +n² for heroes & priests on own side (n = farmer count).
   - `column = getColumnBuff` — non-hero column-bonus from same column count.
4. Compute `fog` and `flag` from `effectSlots`. Flag returns `buffedPoints` *additively* — algebraically equivalent to doubling (see `BUGS.md` §3 for the math).
5. Final `points` = `basePoints + sum(effects)`. Each buff appears exactly once in the total — `buffPoints` is an intermediate used only as input to fog/flag, not added directly.

## Row-completion effects (`construct.ts::addFullRowEffect`)

Triggered when a card fills the last open color slot of a row:

| Row colour | Effect                                              |
| ---------- | --------------------------------------------------- |
| **Blue**   | Owner draws the top card of the deck                |
| **Green**  | Owner restores any card from their own graveyard    |
| **Red**    | Owner destroys the opponent's most recently played card |

## How to run / test changes

### Unit tests
```bash
npm run test --workspace=@madrigal/core
```
12 jest tests; **all 12 pass** since the Flag-name typo (`BUGS.md` §1) was fixed.

### Headless simulation / fuzz testing
```bash
# 20 random-vs-random games, fixed seed (deterministic)
npm run sim --workspace=@madrigal/core -- --games 20 --bot1 random --bot2 random --seed 7

# MCTS vs random to gauge bot strength
npm run sim --workspace=@madrigal/core -- --games 30 --bot1 random --bot2 mcts --iterations 80
```
The CLI prints win rates, average turns, slowest game, and any crashes. Use this to flush out illegal-state bugs.

### Browser preview
```bash
npm run dev                       # core watch + server + frontend
```
Open `http://localhost:3000`. Click **"Play vs Bot"** in the lobby to play against MCTS in-browser (no server round-trip needed for the bot match; it uses `boardgame.io/multiplayer` `Local` transport).

## How to add a new card

1. Add the name string to `CardName` union in `game/src/models.ts`.
2. Add a `CardDefinition` entry to `cardDefinitions` in `game/src/cards.ts` — supply `name`, `points`, `isHero`, `validMoves`, optional `onPlace`.
3. If the card has a stage-changing effect, set `ctx.events?.setActivePlayers({...})` inside `onPlace` (mirror Spy/Thief/Priest/Merchant/Field Marshal).
4. Add it to the deck composition in `construct.ts::makeShuffledDeck`.
5. Add a tooltip line in `frontend/src/lib/cardCopy.ts`.
6. Upload artwork to GCS as `card_images/<normalizedName>-<color>.jpg` (or the frontend will fall back to a missing-image link).
7. Add a jest test in `game/src/cards.test.ts`.

## Key file locations

| What                       | Where                                                                |
| -------------------------- | -------------------------------------------------------------------- |
| Game definition            | `game/src/game.ts`                                                   |
| Move handlers              | `game/src/moves.ts`                                                  |
| Card defs + `validMoves`   | `game/src/cards.ts`                                                  |
| State mutation helpers     | `game/src/construct.ts`                                              |
| Types                      | `game/src/models.ts`                                                 |
| **Bot enumerate**          | `game/src/ai.ts` — drives RandomBot/MCTSBot                         |
| **Sim harness**            | `game/src/sim.ts` + `sim-cli.ts`                                     |
| **Bug log**                | `game/BUGS.md`                                                       |
| Known-failing test         | `game/src/cards.test.ts` ("Flag doubles points…")                    |
| Frontend board             | `frontend/src/components/board/MadrigalBoard.tsx`                    |
| Lobby + bot picker         | `frontend/src/components/lobby/Lobby.tsx`                            |
| Bot-mode Client            | `frontend/src/components/lobby/BotGameClient.tsx`                    |

## Quick sanity check before claiming a change works

1. `npm run test --workspace=@madrigal/core` — all 12 tests should pass.
2. `npm run sim … --games 10 --bot1 random --bot2 random` — zero crashes.
3. In-browser: lobby → Play vs Bot → Easy → play 2 turns → bot responds within a second → no console errors.
