import { Ctx } from "boardgame.io";
export type CardColor = "green" | "blue" | "red" | "gold";
export type CellColor = CardColor | "neutral";
export type Player = "p0" | "p1";

export type Card = Pick<CardDefinition, "name" | "points" | "isHero"> & {
  basePoints: number;
  color: CellColor;
  id?: string;
  imageUrl: string;
};

type Effect = (G: GameState, ctx: Ctx) => GameState;
export interface CardDefinition {
  name: string;
  points: number;
  isHero: boolean;
  onPlace?: Effect;
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
}

export interface PlayerState {
  board: Board;
  hand: Card[];
  graveyard: Card[];
  points: number;
  games: number;
  passed: boolean;
}

export interface GameState {
  players: {
    p0: PlayerState;
    p1: PlayerState;
  };
  deck: Card[];
}
