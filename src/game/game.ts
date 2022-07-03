import { GameState, PlayerState, CardSlot, CellColor, Player } from "../models";
import { Ctx, Game } from "boardgame.io";
import {
  countPlayerPoints,
  drawCard,
  getPlayerState,
  makeShuffledDeck,
  boardToGraveyard,
  incrementGame,
  setPlayerPassed,
  addBuffs,
} from "./construct";
import {
  pass,
  selectGraveyardCard,
  selectBoardCard,
  playCardFromBoard,
  playCardFromHand,
} from "./moves";
import fp from "lodash/fp";
import _ from "lodash";

const P1: Player = "1";
const P0: Player = "0";

function setup(ctx: Ctx): GameState {
  const nCols = 7;

  const rowColors: CellColor[] = ["green", "blue", "red"];
  const emptyPlayerState = (player: Player): PlayerState => {
    function makeEmptyCardSlotRow(color: CellColor, row: number): CardSlot[] {
      const rowStartIndex = row * nCols;
      const endCol = nCols - 1;
      return [
        {
          index: rowStartIndex,
          color: "neutral",
          rowColor: color,
          player,
          row,
          col: 0,
        },
        ..._.range(1, 6).map((col) => ({
          index: rowStartIndex + col,
          color,
          rowColor: color,
          player,
          row,
          col,
        })),
        {
          index: rowStartIndex + endCol,
          color: "neutral",
          rowColor: color,
          player,
          row,
          col: endCol,
        },
      ];
    }
    // const orderedRowColors = rowColors; //player === P0 ? rowColors : _.reverse(rowColors);
    return {
      board: {
        cardSlots: _.flatMap<CellColor, CardSlot>(
          rowColors,
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
      0: emptyPlayerState(P0),
      1: emptyPlayerState(P1),
    },
    deck: makeShuffledDeck(ctx),
  };

  const drawStartingCards = (player: Player) => {
    return _.times(10).map(() => drawCard(ctx, player));
  };
  const addStartingCards = fp.flow([
    ...drawStartingCards(P0),
    ...drawStartingCards(P1),
  ]);

  return addStartingCards(gameState);
}

function assignGameWin(G: GameState) {
  const p0 = getPlayerState(G, P0);
  const p1 = getPlayerState(G, P1);
  // TODO handle tie. Last card played wins
  const winningPlayer: Player = p0.points > p1.points ? P0 : P1;
  return fp.flow(
    setPlayerPassed(P0, false),
    setPlayerPassed(P1, false),
    incrementGame(winningPlayer)
  )(G);
}

function bothPassed(G: GameState) {
  const p0 = getPlayerState(G, P0);
  const p1 = getPlayerState(G, P1);
  return p0.passed && p1.passed;
}

function resetGame(G: GameState) {
  return fp.flow(boardToGraveyard(P0), boardToGraveyard(P1))(G);
}

type Stage =
  | "graveyardOwn"
  | "graveyardBoth"
  | "selectBoardCardOpponent"
  | "selectBoardCardOwn";

const Madrigal: Game<GameState> = {
  setup,
  turn: {
    minMoves: 1,
    onBegin: (G, ctx) => {
      return fp.flow(
        addBuffs(P0),
        addBuffs(P1),
        countPlayerPoints(P0),
        countPlayerPoints(P1)
      )(G);
    },
    stages: {
      graveyardOwn: {
        moves: { selectGraveyardCard },
      },
      graveyardBoth: {
        moves: { selectGraveyardCard },
      },
      selectBoardCardOpponent: {
        moves: { playCardFromBoard },
      },
      selectBoardCardOwn: {
        moves: { playCardFromBoard },
      },
    },
  },
  moves: {
    playCardFromHand,
    pass,
  },
  phases: {
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
    const playerWon = (player: Player) => getPlayerState(G, player).games === 2;
    if (playerWon(P0)) {
      return "Player 1 won!";
    }
    if (playerWon(P1)) {
      return "Player 2 won!";
    }
  },
};

export { Madrigal };
