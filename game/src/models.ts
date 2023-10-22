import { Ctx } from "boardgame.io";
export type CardColor = "green" | "blue" | "red" | "gold";
export type CellColor = CardColor | "neutral";
export type Player = "0" | "1";
export type CardName =
  | "Spy"
  | "Thief"
  | "Fisherman"
  | "Farmer"
  | "Smith"
  | "Merchant"
  | "Priest"
  | "Warrior"
  | "Field marshal"
  | "Treasurer"
  | "Queen"
  | "King"
  | "Fog"
  | "Jester"
  | "Standard";

export type EffectName =
  | "smith"
  | "farmer"
  | "column"
  | "fog"
  | "jester"
  | "flag";

export type Card = Pick<CardDefinition, "name" | "points" | "isHero"> & {
  basePoints: number;
  color: CellColor;
  id: string;
  normalizedName: string;
  effects: Partial<Record<EffectName, number>>;
};

export interface CardDefinition {
  name: CardName;
  points: number;
  isHero: boolean;
  onPlace?: (
    G: GameState,
    ctx: Ctx,
    boardCell: number,
    boardPlayer: Player
  ) => GameState;
  validMoves: (
    card: Card,
    playerBoard: Board,
    opponentBoard: Board
  ) => { player: number[]; opponent: number[] };
}

export interface CardSlot {
  card?: Card;
  row: number;
  col: number;
  index: number;
  color: CellColor;
  player: Player;
  rowColor: CellColor;
}

export interface Board {
  cardSlots: CardSlot[];
  rows: number;
  cols: number;
  history: { cardId: string; boardCell: number }[];
}

export interface PlayerState {
  board: Board;
  hand: Card[];
  graveyard: Card[];
  points: number;
  games: number;
  passed: boolean;
}

export interface GameEvent {
  player: Player | null;
  description: string;
  time?: number;
}

export interface GameState {
  players: {
    0: PlayerState;
    1: PlayerState;
  };
  events: GameEvent[];
  deck: Card[];
}
