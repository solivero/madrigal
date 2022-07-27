import fp from "lodash/fp";
import _ from "lodash";
import {
  Card,
  GameState,
  Board,
  PlayerState,
  Player,
  CardSlot,
  CardColor,
} from "./models";
import { makeCardConstructor, cardDefinitions, slotIsNeutral } from "./cards";

import { Ctx } from "boardgame.io";

type GameStateProducer = (G: GameState) => GameState;

export type CardFetcher = (
  G: GameState,
  player: Player,
  cardId: string
) => Card | null;

export type CardRemover = (player: Player, cardId: string) => GameStateProducer;
function getCurrentPlayer(ctx: Ctx) {
  return ctx.currentPlayer as Player;
}

function makeShuffledDeck(ctx: Ctx): Card[] {
  const colors: CardColor[] = ["green", "blue", "red", "gold"];
  const cardConstructors = _.map(cardDefinitions, makeCardConstructor);
  const cards = _.flatMap(cardConstructors, (constructor) =>
    _.map(colors, constructor)
  );
  const deck = ctx.random?.Shuffle(cards);
  if (deck) {
    return deck;
  }
  return [];
}

const getPlayerState = (G: GameState, player: Player) => G.players[player];

const findByCardId = (cardId: string) =>
  fp.find((card: Card) => card.id === cardId);

function getCardFromPlayer(
  G: GameState,
  playerId: Player,
  cardId: string,
  cardPoolFetcher: (playerState: PlayerState) => Card[]
) {
  const player = getPlayerState(G, playerId);
  const cardPool = cardPoolFetcher(player);
  return findByCardId(cardId)(cardPool) || null;
}

const getCardFromHand: CardFetcher = (G, player, cardId) =>
  getCardFromPlayer(G, player, cardId, (state) => state.hand);

const getCardFromBoard: CardFetcher = (G, player, cardId) => {
  const cards: (state: PlayerState) => Card[] = (state) =>
    state.board.cardSlots
      .filter((slot) => slot.card)
      .map((slot) => slot.card as Card);
  return getCardFromPlayer(G, player, cardId, cards);
};
const getCardFromGraveyard: CardFetcher = (G, player, cardId) =>
  getCardFromPlayer(G, player, cardId, (state) => state.graveyard);

function updatePlayer(
  player: Player,
  updater: (playerState: PlayerState) => Partial<PlayerState>
): GameStateProducer {
  return fp.update(["players", player], (playerState: PlayerState) => ({
    ...playerState,
    ...updater(playerState),
  }));
}

function getColumn(board: Board, colIdx: number): CardSlot[] {
  return _.times(board.rows).map(
    (rowIdx) => board.cardSlots[board.cols * rowIdx + colIdx]
  );
}

function getRow(board: Board, rowIdx: number): CardSlot[] {
  const startIdx = rowIdx * board.cols;
  const endIdx = startIdx + board.cols;
  return board.cardSlots.slice(startIdx, endIdx);
}

function getRowEffectSlots(board: Board, rowIdx: number): CardSlot[] {
  return getRow(board, rowIdx).filter(slotIsNeutral);
}

function getSlot(board: Board, row: number, col: number): CardSlot {
  return board.cardSlots[board.cols * row + col];
}

function getSlotByCardName(cardSlots: CardSlot[], name: string) {
  return cardSlots.find((slot) => slot.card?.name === name);
}

function addBuffs(player: Player): GameStateProducer {
  const determinePoints = (
    slot: CardSlot,
    buffPoints: number,
    jester: boolean,
    fog: boolean,
    flag: boolean
  ) => {
    const { card } = slot;
    if (!card) {
      return 0;
    }
    const isEffectStandard = slotIsNeutral(slot) && card?.name == "Standard";
    if (isEffectStandard) {
      return 0;
    }
    if (jester) {
      return card.basePoints;
    }
    if (fog) {
      return card.isHero ? card.basePoints : 0;
    }
    const buffedPoints = card.basePoints + buffPoints;
    if (flag) {
      return card.isHero ? buffedPoints : buffedPoints * 2;
    }
    return buffedPoints;
  };
  return updatePlayer(player, ({ board }) => {
    const buffedBoard = board.cardSlots.map((slot) => {
      if (!slot?.card) {
        return slot;
      }
      const { card, row } = slot;
      const buffs = [getColumnBuff, getSmithBuff, getFarmerBuff];
      const appliedBuffs = buffs.map((buff) => buff(board, slot));
      const buffPoints = _.sum(appliedBuffs);
      const effectSlots = getRowEffectSlots(board, row);
      // TODO fog applies from other board too!
      const hasFog = !!getSlotByCardName(effectSlots, "Fog");
      const hasJester = !!getSlotByCardName(effectSlots, "Jester");
      const hasFlag = !!getSlotByCardName(effectSlots, "Standard");
      const points = determinePoints(
        slot,
        buffPoints,
        hasJester,
        hasFog,
        hasFlag
      );
      const buffedCard = {
        ...card,
        points,
      };
      return {
        ...slot,
        card: buffedCard,
      };
    });
    return {
      board: {
        ...board,
        cardSlots: buffedBoard,
      },
    };
  });
}

function getColumnBuff(board: Board, slot: CardSlot): number {
  if (slot?.card?.isHero) {
    return 0;
  }
  const card = slot.card as Card;
  const colIdx = slot.index % board.cols;
  const col = getColumn(board, colIdx);
  const sameCards = col.filter(
    (cardSlot) => cardSlot?.card && cardSlot.card.basePoints === card.basePoints
  );
  const points = card.basePoints * (sameCards.length - 1);
  return points;
}

function getSmithBuff(board: Board, slot: CardSlot): number {
  if (slot?.card?.name === "Smith") {
    return 0;
  }
  const rowIdx = Math.floor(slot.index / board.cols);
  const row = getRow(board, rowIdx);
  const smiths = row.filter((slot) => slot?.card?.name === "Smith");
  // Priests don't need weapons!
  if (slot.card?.name !== "Priest") {
    return smiths.length;
  }
  return 0;
}

function getFarmerBuff(board: Board, slot: CardSlot): number {
  const farmers = board.cardSlots.filter(
    (cardSlot) => cardSlot?.card?.name === "Farmer"
  );
  const buffValue = farmers.length * farmers.length;
  if (slot?.card?.isHero) {
    return buffValue;
  }
  return 0;
}

function countPlayerPoints(player: Player): GameStateProducer {
  const getSlotsWithCard = fp.filter((cardSlot: CardSlot) =>
    Boolean(cardSlot?.card)
  );
  const getCards = fp.map((cardSlot: CardSlot) => cardSlot.card as Card);
  const sumPoints = fp.sumBy((card: Card) => card.points);
  const tallyBoardPoints = fp.flow(getSlotsWithCard, getCards, sumPoints);
  return updatePlayer(player, (playerState: PlayerState) => ({
    points: tallyBoardPoints(playerState.board.cardSlots),
  }));
}

function removeCardFromBoard(player: Player, cardId: string) {
  return updatePlayer(player, ({ board }) => {
    const cardSlots = board.cardSlots.map((cardSlot) => {
      if (cardSlot?.card?.id === cardId) {
        return {
          ...cardSlot,
          card: undefined,
        };
      }
      return cardSlot;
    });
    return {
      board: {
        ...board,
        cardSlots,
      },
    };
  });
}

function addCardToBoard(player: Player, card: Card, boardCell: number) {
  // Ridicoulus verbose to update deep structure while avoiding immer error
  return updatePlayer(player, ({ board }) => {
    const cardSlots = board.cardSlots.map((cardSlot) => {
      if (cardSlot.index === boardCell) {
        return {
          ...cardSlot,
          card,
        };
      }
      return cardSlot;
    });
    return {
      board: {
        ...board,
        cardSlots,
      },
    };
  });
}

function addCardToHand(
  ctx: Ctx,
  player: Player,
  card: Card
): GameStateProducer {
  const id = `${player}-${Math.random().toString(36).slice(2)}`;
  const newCard = { ...card, id };
  return updatePlayer(player, (playerState) => ({
    hand: [...playerState.hand, newCard],
  }));
}

function removeCardFromHand(player: Player, cardId: string): GameStateProducer {
  return updatePlayer(player, (playerState) => ({
    hand: playerState.hand.filter((card) => card.id !== cardId),
  }));
}
function removeCardFromGraveyard(
  player: Player,
  cardId: string
): GameStateProducer {
  return updatePlayer(player, (playerState) => ({
    graveyard: playerState.graveyard.filter((card) => card.id !== cardId),
  }));
}

function drawCard(ctx: Ctx, player: Player): GameStateProducer {
  return (G: GameState) => {
    const card = _.head(G.deck);
    if (card) {
      const deck = _.tail(G.deck);
      const gameState = {
        ...G,
        deck,
      };
      return addCardToHand(ctx, player, card)(gameState);
    }
    return G;
  };
}

function setPlayerPassed(player: Player, passed: boolean): GameStateProducer {
  return updatePlayer(player, () => ({
    passed,
  }));
}

function incrementGame(player: Player): GameStateProducer {
  return updatePlayer(player, (playerState) => ({
    games: playerState.games + 1,
  }));
}

function boardToGraveyard(player: Player): GameStateProducer {
  return updatePlayer(player, (playerState) => {
    const boardCards = playerState.board.cardSlots
      .filter((slot) => slot.card)
      .map((slot) => slot.card as Card);
    const emptyCardSlots = playerState.board.cardSlots.map(fp.omit("card"));
    return {
      graveyard: playerState.graveyard.concat(boardCards),
      board: {
        ...playerState.board,
        cardSlots: emptyCardSlots,
      },
    };
  });
}

function getOpponent(player: Player): Player {
  return player === "0" ? "1" : "0";
}

export {
  drawCard,
  removeCardFromHand,
  removeCardFromGraveyard,
  addCardToBoard,
  addCardToHand,
  getPlayerState,
  getCardFromHand,
  countPlayerPoints,
  makeShuffledDeck,
  setPlayerPassed,
  incrementGame,
  boardToGraveyard,
  addBuffs,
  getOpponent,
  getCurrentPlayer,
  getCardFromGraveyard,
  getCardFromBoard,
  removeCardFromBoard,
  getRow,
};
