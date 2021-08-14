import _ from "lodash";
import fp, { flow } from "lodash/fp";
import { Board, Card, CardColor, CardDefinition, CardSlot } from "../models";
import { drawCard, getCurrentPlayer, getPlayerState } from "./construct";

const getImageUrl = (color: CardColor, name: string) =>
  `card_images/${name}-${color}.jpg`;

export const makeCardConstructor =
  (cardDef: CardDefinition) => (color: CardColor) => {
    const { name, points, isHero } = cardDef;
    const card: Card = {
      name,
      color,
      isHero,
      points,
      basePoints: points,
      imageUrl: getImageUrl(color, name.toLowerCase()),
    };
    return card;
  };

export const getCardDef = (name: string) =>
  _.find(cardDefinitions, (cardDef) => cardDef.name === name);

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
    points: 2,
    isHero: false,
    validMoves: (card, playerBoard, opponentBoard) => {
      return {
        player: matchingColorMoves(card, playerBoard),
        opponent: matchingColorMoves(card, opponentBoard),
      };
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
  },
  {
    name: "Fisherman",
    points: 3,
    isHero: false,
    onPlace: (G, ctx) => {
      const player = getCurrentPlayer(ctx);
      return drawCard(ctx, player)(G);
    },
    validMoves: matchingColorPlayerBoardMoves,
  },

  {
    name: "Farmer",
    points: 4,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
  },

  {
    name: "Smith",
    points: 5,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
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
        return drawCard(ctx, player)(G);
      }
      console.log("Should choose from graveyard");
      return G;
    },
  },

  {
    name: "Warrior",
    points: 8,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
  },

  {
    name: "Field marshal",
    points: 9,
    isHero: false,
    validMoves: matchingColorPlayerBoardMoves,
  },

  {
    name: "Treasurer",
    points: 10,
    isHero: true,
    validMoves: matchingColorPlayerBoardMoves,
  },

  {
    name: "Queen",
    points: 11,
    isHero: true,
    validMoves: matchingColorPlayerBoardMoves,
  },

  {
    name: "Treasurer",
    points: 12,
    isHero: true,
    validMoves: matchingColorPlayerBoardMoves,
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
  },

  {
    name: "Fog",
    points: 0,
    isHero: true,
    validMoves: getEffectCardMoves,
  },
  {
    name: "Jester",
    points: 0,
    isHero: true,
    validMoves: getEffectCardMoves,
  },
];
