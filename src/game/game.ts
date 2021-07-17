import { GameState, PlayerState, CardSlot, CellColor, Player } from "../models";
import { Ctx, Game } from "boardgame.io";
import {
  countPlayerPoints,
  drawCard,
  getPlayer,
  makeShuffledDeck,
  boardToGraveyard,
  incrementGame,
  setPlayerPassed,
  addBuffs,
} from "./construct";
import { playCard, pass } from "./moves";
import fp from "lodash/fp";
import _ from "lodash";

function setup(ctx: Ctx): GameState {
  const nCols = 7;
  function makeEmptyCardSlotRow(color: CellColor, row: number): CardSlot[] {
    const rowStartIndex = row * nCols;
    return [
      {
        index: rowStartIndex,
        color: "neutral",
      },
      ..._.range(1, 6).map((index) => ({
        index: rowStartIndex + index,
        color,
      })),
      {
        index: rowStartIndex + 6,
        color: "neutral",
      },
    ];
  }

  const rowColors: CellColor[] = ["red", "blue", "green"];
  const emptyPlayerState = (player: Player): PlayerState => {
    const orderedRowColors = player === "p0" ? rowColors : _.reverse(rowColors);
    return {
      board: {
        cardSlots: _.flatMap<CellColor, CardSlot>(
          orderedRowColors,
          makeEmptyCardSlotRow
        ),
        cols: nCols,
        rows: rowColors.length,
      },
      hand: [],
      graveyard: [],
      points: 0,
      games: 0,
      passed: false,
    };
  };
  const gameState: GameState = {
    players: {
      p0: emptyPlayerState("p0"),
      p1: emptyPlayerState("p1"),
    },
    deck: makeShuffledDeck(ctx),
  };

  const drawStartingCards = (player: Player) => {
    return _.times(10).map(() => drawCard(ctx, player));
  };
  const addStartingCards = fp.flow([
    ...drawStartingCards("p0"),
    ...drawStartingCards("p1"),
  ]);

  return addStartingCards(gameState);
}

function assignGameWin(G: GameState) {
  const p0 = getPlayer(G, "p0");
  const p1 = getPlayer(G, "p1");
  // TODO handle tie. Last card played wins
  const winningPlayer: Player = p0.points > p1.points ? "p0" : "p1";
  return fp.flow(
    setPlayerPassed("p0", false),
    setPlayerPassed("p1", false),
    incrementGame(winningPlayer)
  )(G);
}

function bothPassed(G: GameState) {
  const p0 = getPlayer(G, "p0");
  const p1 = getPlayer(G, "p1");
  return p0.passed && p1.passed;
}

function resetGame(G: GameState) {
  return fp.flow(boardToGraveyard("p0"), boardToGraveyard("p1"))(G);
}

const Madrigal: Game<GameState> = {
  setup,
  turn: {
    moveLimit: 1,
    onBegin: (G, ctx) => {
      // const player = 'p' + ctx.currentPlayer as Player
      return fp.flow(
        // drawCard(ctx, player),
        addBuffs("p0"),
        addBuffs("p1"),
        countPlayerPoints("p0"),
        countPlayerPoints("p1")
      )(G);
    },
  },
  moves: {
    playCard,
    pass,
  },
  phases: {
    // TODO card exchange stage
    game1: {
      start: true,
      endIf: bothPassed,
      onEnd: assignGameWin,
      next: "game2",
    },
    game2: {
      endIf: bothPassed,
      onBegin: resetGame,
      onEnd: assignGameWin,
      next: "game3",
    },
    game3: {
      endIf: bothPassed,
      onBegin: resetGame,
      onEnd: assignGameWin,
    },
  },
  endIf: (G, ctx) => {
    // TODO count gem. 2 wins
    const playerWon = (player: Player) => getPlayer(G, player).games === 2;
    if (playerWon("p0")) {
      return "Player 1 won!";
    }
    if (playerWon("p1")) {
      return "Player 2 won!";
    }
  },
};

export { Madrigal };
