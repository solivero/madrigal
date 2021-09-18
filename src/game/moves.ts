import { INVALID_MOVE } from "boardgame.io/core";
import fp from "lodash/fp";
import { Ctx } from "boardgame.io";
import { GameState, Player } from "../models";
import {
  getPlayerState,
  getCardFromHand,
  addCardToBoard,
  removeCardFromHand,
  removeCardFromGraveyard,
  setPlayerPassed,
  getOpponent,
  getCurrentPlayer,
  addCardToHand,
  getCardFromGraveyard,
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
  const card = getCardFromHand(G, player, cardId);
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
    (G) =>
      cardDef.onPlace ? cardDef.onPlace(G, ctx, boardCell, boardPlayer) : G
  )(G);
}

function pass(G: GameState, ctx: Ctx): GameState {
  const player = getCurrentPlayer(ctx);
  ctx.events?.endTurn();
  return setPlayerPassed(player, true)(G);
}
function endTurn(G: GameState, ctx: Ctx): GameState {
  ctx.events?.endTurn();
  return G;
}
function selectGraveyardCard(
  G: GameState,
  ctx: Ctx,
  cardId: string,
  fromPlayerId: Player
): GameState {
  const currentPlayerId = getCurrentPlayer(ctx);
  const card = getCardFromGraveyard(G, fromPlayerId, cardId);
  if (!card) {
    console.error("Selected card does not exists");
    return G;
  }
  ctx.events?.endTurn(); // Only if maxMoves - 1
  return fp.flow(
    addCardToHand(ctx, currentPlayerId, card),
    removeCardFromGraveyard(fromPlayerId, cardId)
  )(G);
}

export { endTurn, playCard, pass, selectGraveyardCard };
