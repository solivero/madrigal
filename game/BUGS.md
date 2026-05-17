# Madrigal game-logic bugs

Status as of the most recent audit. Bug #1 is fixed; the others were initially flagged but a careful re-read of `construct.ts::addBuffs` showed the code is correct. Kept here for posterity and to record the math.

---

## 1. Flag card lookup uses wrong name — **FIXED**

**File:** `src/construct.ts:277`

```ts
function getFlagEffect(effectSlots, card, buffedPoints): number {
  const flag = !!getSlotByCardName(effectSlots, "Standard");  // was: "Flag"
  if (flag) { ... }
}
```

The card name everywhere else in the code is `"Standard"` (`cards.ts:279`, `models.ts::CardName`). `"Flag"` is the colloquial in-rules term but is **not** a `CardName`, so `getSlotByCardName` never returned a match and the flag effect never fired.

**Fix landed:** literal changed to `"Standard"`.

**Test impact:** the previously failing `"Flag doubles points for row when placed in effect slot"` jest test now passes. All 12 tests green.

---

## 2. Buffs double-counted in `points` — **FALSE ALARM**

Earlier write-up claimed `effects = { ...buffs, fog, flag }` caused `buffPoints` to be summed into `points` twice. **It does not.** Re-tracing the code:

```ts
const buffs        = { smith, farmer, column };
const buffPoints   = sum(buffs);                  // INTERMEDIATE — not added to points
const buffedPoints = card.basePoints + buffPoints; // INPUT to fog/flag
const effects      = { ...buffs, fog, flag };     // accounting record
const effectPoints = sum(effects);                // = smith+farmer+column+fog+flag
const points       = card.basePoints + effectPoints;
```

Each buff appears in the final total **exactly once** — via the spread into `effects`. `buffPoints` is never added to `points`; it only flows into `points` indirectly, as the *input* `buffedPoints` to `getFogEffect` and `getFlagEffect` (which use it to size their own contribution).

The pattern is actually clean: `effects` is both the display record (the per-source breakdown the UI reads) and the sum-to-total record. The `buffPoints` intermediate exists so fog/flag can see the buffed value when computing their multiplier-by-addition (see bug #3).

**No code change.**

---

## 3. Flag returns `buffedPoints` additively instead of multiplying — **FALSE ALARM**

Earlier write-up claimed the flag should multiply but returns an additive `buffedPoints`, so the math is wrong. **The math is correct** — additive `buffedPoints` is algebraically equivalent to doubling:

```
points = basePoints + buffs + flag
       = basePoints + buffs + buffedPoints
       = basePoints + buffs + (basePoints + buffs)
       = 2 × (basePoints + buffs)
       = 2 × buffedPoints
```

For heroes (priests included), `getFlagEffect` returns 0, so they correctly aren't doubled. The "flag returns `buffedPoints`" trick reuses the same `effects`-accumulator design from bug #2's analysis: every contribution flows through `effects` and gets summed once into `points`.

**No code change.** That said, the additive approach is fragile: if someone adds a new buff source without including it in the `buffs` object, the flag would silently fail to double it. A future cleanup could replace this with an explicit `multiplier` field in `effects` and apply it after summing additive terms — but that's a refactor, not a bug fix.

---

## 4. Fog × flag in the same row cancel exactly — **FIXED**

**File:** `src/construct.ts:284–294` (fog) and `:272–282` (flag).

Previously: if both a Fog and a Standard (flag) sat in the side slots of the same row, their additive contributions cancelled (Fog returned `-buffedPoints`, Flag returned `+buffedPoints`, sum was 0), and the card landed at `buffedPoints` — as if neither effect existed.

**Fix landed:** `addBuffs::determinePoints` now short-circuits on Fog the same way it short-circuits on Jester. If a Fog is in the row and the card is not a hero, it returns `{ points: 0, effects: { fog: -basePoints } }` immediately — flag and buffs are skipped. Heroes (incl. priest) stay immune. New regression test: `"Fog wins over Standard in the same row"` in `cards.test.ts`.

---

## 5. Low-priority pre-existing TODOs

These were in the codebase before this audit. Leaving them.

- **`game.ts:101`** — `TODO handle tie. Last card played wins`. Currently a tie awards the game to player 1 by default (the `>` comparison falls through to P1). Visible in `npm run sim` results as artificially high P1 win rates when both bots are similar strength.
- **`construct.ts:232`** — `// TODO fog applies from other board too!` — fog is single-sided in the implementation but the rules say it should hit the same-color row on both players. (If you fix this, also revisit bug #4 above since the interaction changes.)
- The deck composition in `construct.ts::makeShuffledDeck` isn't documented; `npm run sim` is the practical way to verify card-count distributions.

---

## Test status

```bash
$ npm run test --workspace=@madrigal/core
Tests:       12 passed, 12 total
```
