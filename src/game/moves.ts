import { INVALID_MOVE } from "boardgame.io/core";
import fp from "lodash/fp";
import { Ctx } from "boardgame.io";
import { GameState, Player } from "../models";
import {
  getPlayerState,
  getCardOnHand,
  addCardToBoard,
  removeCardFromHand,
  setPlayerPassed,
  getOpponent,
  getCurrentPlayer,
} from "./construct";
import { getCardDef } from "./cards";

function playCard(
  G: GameState,
  ctx: Ctx,
  cardId: string,
  boardCell: number,
  boardPlayer: Player
) {
  const player = getCurrentPlayer(ctx);
  console.log(player, cardId, boardCell);
  const card = getCardOnHand(G, player, cardId);
  if (!card) {
    return INVALID_MOVE;
  }
  const board = getPlayerState(G, boardPlayer).board;
  if (board.cardSlots[boardCell].card) {
    console.log("Occupied");
    return INVALID_MOVE;
  }
  const playerBoard = getPlayerState(G, player).board;
  const opponent = getOpponent(player);
  const opponentBoard = getPlayerState(G, opponent).board;
  const cardDef = getCardDef(card.name);
  if (!cardDef) {
    console.error("No definition for card", card);
    return INVALID_MOVE;
  }
  const validMoves = cardDef?.validMoves(card, playerBoard, opponentBoard);
  console.log(validMoves);
  if (boardPlayer === player && !validMoves?.player.includes(boardCell)) {
    return INVALID_MOVE;
  }
  if (boardPlayer === opponent && !validMoves?.opponent.includes(boardCell)) {
    return INVALID_MOVE;
  }
  return fp.flow(
    removeCardFromHand(player, cardId),
    addCardToBoard(boardPlayer, card, boardCell),
    setPlayerPassed(player, false),
    (G) => (cardDef.onPlace ? cardDef.onPlace(G, ctx) : G)
  )(G);
}

function pass(G: GameState, ctx: Ctx): GameState {
  const player = getCurrentPlayer(ctx);
  return setPlayerPassed(player, true)(G);
}

export { playCard, pass };
