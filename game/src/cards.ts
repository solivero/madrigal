import _ from "lodash";
import fp, { flow } from "lodash/fp";
import {
  Board,
  Card,
  CardColor,
  CardDefinition,
  CardName,
  CardSlot,
  Player,
} from "./models";
import {
  drawCard,
  getCurrentPlayer,
  getOpponent,
  getPlayerState,
} from "./construct";
import { endTurn } from "./moves";

export const getNormalizedName = (name: string) =>
  name.toLowerCase().replace(" ", "_");

const makeCardId = (cardDef: CardDefinition, color: CardColor) =>
  `${getNormalizedName(cardDef.name)}-${color}-${Math.random()
    .toString(36)
    .slice(2)}`;

export const makeCardConstructor =
  (cardDef: CardDefinition) => (color: CardColor) => {
    const { name, points, isHero } = cardDef;
    const card: Card = {
      name,
      color,
      isHero,
      points,
      basePoints: points,
      normalizedName: getNormalizedName(name),
      id: makeCardId(cardDef, color),
      effects: {},
    };
    return card;
  };

export const getCardDef = (name: CardName) => {
  const def = _.find(cardDefinitions, (cardDef) => cardDef.name === name);
  if (!def) {
    throw Error(`No definition for ${name}`);
  }
  return def;
};

export const makeCard = (name: CardName, color: CardColor) => {
  const def = getCardDef(name);
  const constructor = makeCardConstructor(def);
  return constructor(color);
};

export const slotIsNeutral = (slot: CardSlot) => slot.color === "neutral";
const cardIsGold = (card: Card) => card.color === "gold";
const getIndexes = fp.map<CardSlot, number>((slot) => slot.index);

const getEffectCardMoves = (
  card: Card,
  playerBoard: Board,
  opponentBoard: Board
) => {
  const filterNeutral = fp.filter(slotIsNeutral);
  const isGoldCard = cardIsGold(card);
  const matchesRowColor = fp.filter<CardSlot>(
    (slot) => slot.rowColor === card.color || isGoldCard
  );
  const neutralIndexes = flow(filterNeutral, matchesRowColor, getIndexes);
  return {
    player: neutralIndexes(playerBoard.cardSlots),
    opponent: neutralIndexes(opponentBoard.cardSlots),
  };
};

const matchingColorMoves = (card: Card, board: Board) => {
  const filterNotNeutral = fp.filter(fp.complement(slotIsNeutral));
  const isGoldCard = cardIsGold(card);
  const matchesSlotColor = fp.filter<CardSlot>(
    (slot) => slot.color === card.color || isGoldCard
  );
  const matchingIndexes = flow(filterNotNeutral, matchesSlotColor, getIndexes);
  return matchingIndexes(board.cardSlots);
};

const matchingColorPlayerBoardMoves = (card: Card, playerBoard: Board) => {
  return {
    player: matchingColorMoves(card, playerBoard),
    opponent: [],
  };
};

export const cardDefinitions: CardDefinition[] = [
  {
    name: "Spy",
    points: 1,
    isHero: false,
    validMoves: (card, playerBoard, opponentBoard) => {
      return {
        player: matchingColorMoves(card, playerBoard),
        opponent: matchingColorMoves(card, opponentBoard),
      };
    },
    onPlace: (G, ctx, _boardCell: number, boardPlayer: Player) => {
      const playerId = getCurrentPlayer(ctx);
      const player = getPlayerState(G, playerId);
      const opponentId = getOpponent(playerId);
      const opponent = getPlayerState(G, opponentId);
      const graveyardsHaveCards =
        opponent.graveyard.length || player.graveyard.length;
      const isOpponentBoard = boardPlayer === opponentId;
      if (isOpponentBoard && graveyardsHaveCards) {
        ctx.events?.setActivePlayers({
          currentPlayer: { stage: "graveyardBoth", moveLimit: 1 },
        });
      } else {
        console.log("Own board or empty graveyards! End turn");
        ctx.events?.endTurn();
      }
      return G;
    },
  },
  {
    name: "Thief",
    points: 2,
    isHero: false,
    validMoves: (card, playerBoard, opponentBoard) => {
      return {
        player: matchingColorMoves(card, playerBoard),
        opponent: matchingColorMoves(card, opponentBoard),
      };
    },
    onPlace: (G, ctx, _boardCell, boardPlayer) => {
      const playerId = getCurrentPlayer(ctx);
      const { graveyard } = getPlayerState(G, playerId);
      const isOpponentBoard = boardPlayer !== playerId;
      if (isOpponentBoard && graveyard.length) {
        ctx.events?.setActivePlayers({
          currentPlayer: { stage: "graveyardOwn", moveLimit: 2 },
        });
      } else {
        console.log("Own board or empty graveyard! End turn");
        ctx.events?.endTurn();
      }
      return G;
    },
  },
  {
    name: "Fisherman",
    points: 3,
    isHero: false,
    onPlace: (G, ctx) => {
      const player = getCurrentPlayer(ctx);
      ctx.events?.endTurn();
      return drawCard(player)(G);
    },
    validMoves: matchingColorPlayerBoardMoves,
  },

  {
    name: "Farmer",
    points: 4,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: endTurn,
  },

  {
    name: "Smith",
    points: 5,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: endTurn,
  },

  {
    name: "Merchant",
    points: 6,
    isHero: false,
    validMoves: (card, playerBoard, opponentBoard) => {
      return {
        player: matchingColorMoves(card, playerBoard),
        opponent: matchingColorMoves(card, opponentBoard),
      };
    },
    onPlace: (G, ctx, _boardCell, boardPlayer) => {
      const playerId = getCurrentPlayer(ctx);
      const opponentId = getOpponent(playerId);
      const isOpponentBoard = boardPlayer === opponentId;
      if (isOpponentBoard) {
        ctx.events?.setActivePlayers({
          currentPlayer: "selectBoardCardOpponent",
          maxMoves: 1,
        });
      } else {
        ctx.events?.endTurn();
      }
      return G;
    },
  },

  {
    name: "Priest",
    points: 7,
    isHero: true,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: (G, ctx) => {
      const player = getCurrentPlayer(ctx);
      const { graveyard } = getPlayerState(G, player);
      if (graveyard.length === 0) {
        console.log("Drew card from deck because of empty graveyard");
        ctx.events?.endTurn();
        return drawCard(player)(G);
      }
      console.log("Should choose from graveyard");
      ctx.events?.setActivePlayers({
        currentPlayer: "graveyardOwn",
        maxMoves: 1,
      });
      return G;
    },
  },

  {
    name: "Warrior",
    points: 8,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: endTurn,
  },

  {
    name: "Field marshal",
    points: 9,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: (G, ctx) => {
      const hasAnyCardsOnBoard = G.players[
        ctx.playerID as Player
      ].board.cardSlots.some((slot) => slot.card);
      if (hasAnyCardsOnBoard) {
        ctx.events?.setActivePlayers({
          currentPlayer: "selectBoardCardOwn",
          maxMoves: 1,
        });
      }
      return G;
    },
  },

  {
    name: "Treasurer",
    points: 10,
    isHero: true,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: endTurn,
  },

  {
    name: "Queen",
    points: 11,
    isHero: true,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: endTurn,
  },

  {
    name: "King",
    points: 12,
    isHero: true,
    validMoves: matchingColorPlayerBoardMoves,
    onPlace: endTurn,
  },

  {
    name: "Standard",
    points: 13,
    isHero: true,
    validMoves: (card, playerBoard) => {
      const isGoldCard = cardIsGold(card);
      const matchesRowColor = fp.filter<CardSlot>(
        (slot) => slot.rowColor === card.color || isGoldCard
      );
      const matchingRowColorMoves = flow(matchesRowColor, getIndexes);
      return {
        player: matchingRowColorMoves(playerBoard.cardSlots),
        opponent: [],
      };
    },
    onPlace: endTurn,
  },

  {
    name: "Fog",
    points: 0,
    isHero: true,
    validMoves: getEffectCardMoves,
    onPlace: endTurn,
  },
  {
    name: "Jester",
    points: 0,
    isHero: true,
    validMoves: getEffectCardMoves,
    onPlace: endTurn,
  },
];
