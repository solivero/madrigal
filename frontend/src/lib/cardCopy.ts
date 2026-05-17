import type { CardName } from "@madrigal/core/dist/models";

const heroDescription =
  "Hero. Unaffected by effects, flags, combinations, or fog. Buffs from farmers and smiths still apply.";

export const cardDescriptions: Record<CardName, string> = {
  Spy: "Place on opponent's side and draw a card from either graveyard. Opponent picks the placement in the matching color row. If no graveyard cards, placed at value 1 with no effect.",
  Thief:
    "Place on opponent's side. Draw 2 cards from your graveyard. Opponent picks placement by color, otherwise placed at value 2 with no effect.",
  Fisherman:
    "Draw the top card from the deck. Opponent may say 'finns i sjön' for full effect.",
  Farmer:
    "Boosts all heroes and priests (7, 10, 11, 12, 13) on your side by +1. Multiple farmers multiply: 2 farmers give +2 each, 3 give +3, etc.",
  Smith:
    "Raises every card in the same row by +1 (excluding priests — they need no weapons).",
  Merchant:
    "Place on opponent's side and steal any card from them to your side. Opponent picks the merchant placement by color. Stolen card's effect triggers immediately.",
  Priest:
    "Place on your side, then draw any card from your graveyard or the top of the deck. Priests, like heroes, ignore combos, effects, and flags.",
  Warrior: "The only card with no effect.",
  "Field marshal":
    "Move any card on your side to another valid spot. Gold cards may change row.",
  Treasurer: heroDescription,
  Queen: heroDescription,
  King: heroDescription,
  Standard:
    "Play as a hero worth 13, or beside a row as a flag — doubles the row's points (excl. heroes, priests, and their buffs). Flags may sit on either side if room allows.",
  Fog: "Removes all points (excl. heroes) from a row of the same color on both players.",
  Jester:
    "Neutralizes all current and future effects, fog, flags, combos, and buffs on the row it's placed on. May be played on either side.",
};
