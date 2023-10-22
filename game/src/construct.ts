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
  GameEvent,
} from "./models";
import { makeCardConstructor, cardDefinitions, slotIsNeutral } from "./cards";

import { Ctx, Game } from "boardgame.io";

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

function addFullRowEffect(player: Player, card: Card, boardCell: number) {
  return (G: GameState, ctx: Ctx) => {
    const playerState = getPlayerState(G, player);
    const { board } = playerState;
    const slotColor = board.cardSlots[boardCell].color;
    if (slotColor === "neutral") {
      return G; // Noop
    }
    const coloredRowSlots = board.cardSlots.filter(
      (cardSlot) => cardSlot.color === slotColor
    );
    if (coloredRowSlots.every((cardSlot) => cardSlot.card)) {
      console.log(slotColor, "row is full. Do effect!");
      switch (slotColor) {
        case "blue":
          return fp.flow(
            drawCard(player),
            addEvent({
              player,
              description: `Full blue row. Drew card from deck`,
            })
          )(G);
        case "green":
          if (playerState.graveyard.length === 0) {
            console.log("Graveyard is empty. Do nothing");
            return addEvent({
              player,
              description: `Full green row. Empty graveyard`,
            })(G);
          }
          // Did not work, probably because endTurn is called by the card onPlace before this takes effect
          // ctx.events?.setActivePlayers({
          //   [player]: { stage: "selectGraveyardOwn", maxMoves: 1 },
          // });
          const graveyardCard = _.first(playerState.graveyard);
          if (!graveyardCard?.id) {
            return G;
          }
          const card = getCardFromGraveyard(G, player, graveyardCard.id);
          if (card?.id) {
            return _.flow(
              addCardToHand(player, card),
              removeCardFromGraveyard(player, card.id),
              addEvent({
                player,
                description: `Full green row. Drew card from graveyard`,
              })
            )(G);
          }
        case "red":
          const opponent = getOpponent(player);
          const opponentState = getPlayerState(G, opponent);
          const { board } = opponentState;
          const getLastPlayed = (history: any[]): any => {
            const [historyItem, ...historyTail] = history;
            if (!historyItem) {
              return;
            } else if (
              // Still there?
              board.cardSlots[historyItem.boardCell].card?.id ===
              historyItem.cardId
            ) {
              return historyItem;
            } else {
              return getLastPlayed(historyTail);
            }
          };
          const lastPlayed = getLastPlayed(board.history);
          if (lastPlayed) {
            return fp.flow(
              removeCardFromBoard(opponent, lastPlayed.cardId),
              addEvent({
                player: opponent,
                description: `Full red row. Eliminated ${lastPlayed.cardId} from opponent`,
              })
            )(G);
          }
          return G;
        default:
          return G;
      }
    }
    return G;
  };
}

function addBuffs(player: Player): GameStateProducer {
  // TODO
  // Make list of buffs with +/- modifiers
  // Determine points by checking jest/fog/flag in effects array
  // Sum buffpoints from array if applicable
  const determinePoints = (
    board: Board,
    slot: CardSlot
  ): Pick<Card, "effects" | "points"> => {
    const { card } = slot;
    if (!card) {
      throw new Error("Card is falsy");
    }
    const isEffectStandard = slotIsNeutral(slot) && card?.name == "Standard";
    if (isEffectStandard) {
      return { points: 0, effects: {} };
    }
    const effectSlots = getRowEffectSlots(board, slot.row);
    const jester = !!getSlotByCardName(effectSlots, "Jester");
    if (jester) {
      return {
        points: card.basePoints,
        effects: { jester: 0 },
      };
    }
    // First Jester - removes all other!
    // Get modifiers for buffs
    // Get modifiers for effects that are based on buffs (i.e fog and flag)
    // Filter out modifiers == 0
    // Sum effects
    // Return effects
    const buffs = {
      smith: getSmithBuff(board, slot),
      farmer: getFarmerBuff(board, slot),
      column: getColumnBuff(board, slot),
    };
    const buffPoints = _.sum(Object.values(buffs));
    const buffedPoints = card.basePoints + buffPoints;
    const effects = {
      ...buffs,
      // TODO fog applies from other board too!
      fog: getFogEffect(effectSlots, card, buffedPoints),
      flag: getFlagEffect(effectSlots, card, buffedPoints),
    };
    // Filter out modifiers with 0 points, i.e inactive
    const activeEffects = _.omitBy(effects, (points) => points == 0);

    const effectPoints = _.sum(Object.values(effects));
    const points = card.basePoints + effectPoints;
    return { points, effects: activeEffects };
  };
  return updatePlayer(player, ({ board }) => {
    const buffedBoard = board.cardSlots.map((slot) => {
      if (!slot?.card) {
        return slot;
      }
      const { card } = slot;
      const { points, effects } = determinePoints(board, slot);
      if (points !== card.basePoints) {
        console.log(card.normalizedName, "got effects", effects);
      }
      const buffedCard = {
        ...card,
        points,
        effects,
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

function getFlagEffect(
  effectSlots: CardSlot[],
  card: Card,
  buffedPoints: number
): number {
  const flag = !!getSlotByCardName(effectSlots, "Flag");
  if (flag) {
    return card.isHero ? 0 : buffedPoints;
  }
  return 0;
}

function getFogEffect(
  effectSlots: CardSlot[],
  card: Card,
  buffedPoints: number
): number {
  const fog = !!getSlotByCardName(effectSlots, "Fog");
  if (fog) {
    return card.isHero ? card.basePoints - buffedPoints : -buffedPoints;
  }
  return 0;
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
  const name = "smith";
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
        history: [{ cardId: card.id, boardCell }, ...board.history],
      },
    };
  });
}

function addCardToHand(player: Player, card: Card): GameStateProducer {
  return updatePlayer(player, (playerState) => ({
    hand: [...playerState.hand, card],
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

function drawCard(player: Player): GameStateProducer {
  return (G: GameState) => {
    const card = _.head(G.deck);
    if (card) {
      const deck = _.tail(G.deck);
      const gameState = {
        ...G,
        deck,
      };
      return addCardToHand(player, card)(gameState);
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

function addEvent(event: GameEvent): GameStateProducer {
  return (G) => ({
    ...G,
    events: [...G.events, { ...event, time: Date.now() }],
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
  addFullRowEffect,
  addEvent,
};
