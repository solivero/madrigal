import { INVALID_MOVE } from "boardgame.io/core";
import fp from "lodash/fp";
import { Ctx } from "boardgame.io";
import { Card, GameState, Player } from "../models";
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
  getCardFromBoard,
  removeCardFromBoard,
} from "./construct";
import { getCardDef } from "./cards";

function isValidMove(
  G: GameState,
  ctx: Ctx,
  card: Card | null,
  boardCell: number,
  boardPlayer: Player
) {
  if (!card) {
    console.log("Not a card");
    return false;
  }
  const board = getPlayerState(G, boardPlayer).board;
  if (board.cardSlots[boardCell].card) {
    console.log("Occupied");
    return false;
  }
  const cardDef = getCardDef(card.name);
  if (!cardDef) {
    console.error("No definition for card", card);
    return false;
  }
  const player = getCurrentPlayer(ctx);
  const playerBoard = getPlayerState(G, player).board;
  const opponent = getOpponent(player);
  const opponentBoard = getPlayerState(G, opponent).board;

  const validMoves = cardDef?.validMoves(card, playerBoard, opponentBoard);
  console.log(validMoves);
  if (boardPlayer === player && !validMoves?.player.includes(boardCell)) {
    console.log("Trying to play on my side");
    return false;
  }
  if (boardPlayer === opponent && !validMoves?.opponent.includes(boardCell)) {
    console.log("Trying to play on opponent side");
    return false;
  }
  return true;
}

function playCardFromHand(
  G: GameState,
  ctx: Ctx,
  cardId: string,
  boardCell: number,
  boardPlayer: Player
) {
  const player = getCurrentPlayer(ctx);
  const card = getCardFromHand(G, player, cardId);
  console.log(player, cardId, boardCell);
  if (!isValidMove(G, ctx, card, boardCell, boardPlayer)) {
    console.log("INVALID_MOVE");
    return INVALID_MOVE;
  }
  const cardDef = getCardDef((card as Card).name);
  return fp.flow(
    removeCardFromHand(player, cardId),
    addCardToBoard(boardPlayer, card as Card, boardCell),
    setPlayerPassed(player, false),
    (G) =>
      cardDef?.onPlace ? cardDef.onPlace(G, ctx, boardCell, boardPlayer) : G
  )(G);
}

function playCardFromBoard(
  G: GameState,
  ctx: Ctx,
  cardId: string,
  boardCell: number,
  toBoardPlayer: Player,
  fromBoardPlayer: Player
) {
  const player = getCurrentPlayer(ctx);
  const card = getCardFromBoard(G, fromBoardPlayer, cardId);
  console.log(player, cardId, boardCell);
  if (!isValidMove(G, ctx, card, boardCell, toBoardPlayer)) {
    console.log("INVALID_MOVE");
    return INVALID_MOVE;
  }
  return fp.flow(
    removeCardFromBoard(fromBoardPlayer, cardId),
    addCardToBoard(toBoardPlayer, card as Card, boardCell)
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

function selectBoardCard(
  G: GameState,
  ctx: Ctx,
  cardId: string,
  fromPlayerId: Player
) {
  const currentPlayerId = getCurrentPlayer(ctx);
  const card = getCardFromBoard(G, fromPlayerId, cardId);
  if (!card) {
    console.error("Selected card does not exists");
    return INVALID_MOVE;
  }
  return G;
}

export {
  endTurn,
  pass,
  selectGraveyardCard,
  selectBoardCard,
  playCardFromBoard,
  playCardFromHand,
};
