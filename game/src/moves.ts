import { INVALID_MOVE } from "boardgame.io/core";
import fp from "lodash/fp";
import { Ctx } from "boardgame.io";
import { Card, GameState, Player } from "./models";
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
  addFullRowEffect,
} from "./construct";
import { getCardDef, getNormalizedName } from "./cards";

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
  const card = getCardFromHand(G, player, cardId) as Card;
  console.log(player, cardId, boardCell);
  if (!card) {
    console.error(`Card ${cardId} does not exist in player ${player} hand!`);
    return G;
  }
  if (!isValidMove(G, ctx, card, boardCell, boardPlayer)) {
    console.log("INVALID_MOVE");
    return INVALID_MOVE;
  }
  const cardDef = getCardDef(card.name);
  return fp.flow(
    removeCardFromHand(player, cardId),
    addCardToBoard(boardPlayer, card, boardCell),
    (G) => addFullRowEffect(boardPlayer, card, boardCell)(G, ctx),
    setPlayerPassed(player, false),
    (G) =>
      cardDef?.onPlace ? cardDef.onPlace(G, ctx, boardCell, boardPlayer) : G
  )(G);
}

// Selected card is assumed to be from valid player board
function playCardFromBoard(
  G: GameState,
  ctx: Ctx,
  cardId: string,
  boardCell: number,
  toBoardPlayer: Player,
  fromBoardPlayer: Player
) {
  const player = getCurrentPlayer(ctx);
  const card = getCardFromBoard(G, fromBoardPlayer, cardId) as Card;
  console.log(player, cardId, boardCell);
  if (!isValidMove(G, ctx, card, boardCell, toBoardPlayer)) {
    console.log("INVALID_MOVE");
    return INVALID_MOVE;
  }
  const cardDef = getCardDef(card.name);
  return fp.flow(
    removeCardFromBoard(fromBoardPlayer, cardId),
    addCardToBoard(toBoardPlayer, card, boardCell),
    addFullRowEffect(toBoardPlayer, card, boardCell),
    (G) => {
      // card must switch sides to activate onPlace effect
      if (cardDef?.onPlace && fromBoardPlayer !== toBoardPlayer) {
        return cardDef.onPlace(G, ctx, boardCell, toBoardPlayer);
      } else {
        return G;
      }
    }
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
  return fp.flow(
    addCardToHand(currentPlayerId, card),
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
