import type { Ctx } from "boardgame.io";
import type { GameState, Player } from "./models";
import { getCardDef } from "./cards";
import { getPlayerState, getOpponent } from "./construct";

interface Move {
  move: string;
  args: unknown[];
}

function getStage(ctx: Ctx, playerID: string): string | undefined {
  return ctx.activePlayers?.[playerID];
}

function defaultMoves(G: GameState, playerID: Player): Move[] {
  const player = getPlayerState(G, playerID);
  const opponent = getPlayerState(G, getOpponent(playerID));
  const moves: Move[] = [{ move: "pass", args: [] }];

  for (const card of player.hand) {
    let def;
    try {
      def = getCardDef(card.name);
    } catch {
      continue;
    }
    const valid = def.validMoves(card, player.board, opponent.board);
    for (const idx of valid.player) {
      if (!player.board.cardSlots[idx]?.card) {
        moves.push({
          move: "playCardFromHand",
          args: [card.id, idx, playerID],
        });
      }
    }
    for (const idx of valid.opponent) {
      if (!opponent.board.cardSlots[idx]?.card) {
        moves.push({
          move: "playCardFromHand",
          args: [card.id, idx, getOpponent(playerID)],
        });
      }
    }
  }
  return moves;
}

function graveyardMoves(
  G: GameState,
  playerID: Player,
  includeOpponent: boolean
): Move[] {
  const moves: Move[] = [];
  const ownGrave = getPlayerState(G, playerID).graveyard;
  for (const card of ownGrave) {
    moves.push({ move: "selectGraveyardCard", args: [card.id, playerID] });
  }
  if (includeOpponent) {
    const oppId = getOpponent(playerID);
    for (const card of getPlayerState(G, oppId).graveyard) {
      moves.push({ move: "selectGraveyardCard", args: [card.id, oppId] });
    }
  }
  return moves;
}

function selectBoardMoves(
  G: GameState,
  playerID: Player,
  side: "own" | "opponent"
): Move[] {
  const moves: Move[] = [];
  const fromId: Player = side === "own" ? playerID : getOpponent(playerID);
  const fromBoard = getPlayerState(G, fromId).board;
  const player = getPlayerState(G, playerID);
  const opponent = getPlayerState(G, getOpponent(playerID));

  for (const slot of fromBoard.cardSlots) {
    const card = slot.card;
    if (!card) continue;
    let def;
    try {
      def = getCardDef(card.name);
    } catch {
      continue;
    }
    const valid = def.validMoves(card, player.board, opponent.board);
    // Target on own board
    for (const idx of valid.player) {
      if (!player.board.cardSlots[idx]?.card) {
        moves.push({
          move: "playCardFromBoard",
          args: [card.id, idx, playerID, fromId],
        });
      }
    }
    // Target on opponent board
    for (const idx of valid.opponent) {
      if (!opponent.board.cardSlots[idx]?.card) {
        moves.push({
          move: "playCardFromBoard",
          args: [card.id, idx, getOpponent(playerID), fromId],
        });
      }
    }
  }
  return moves;
}

export function enumerate(G: GameState, ctx: Ctx, playerID: string): Move[] {
  const pid = playerID as Player;
  const stage = getStage(ctx, playerID);

  switch (stage) {
    case "graveyardOwn":
      return graveyardMoves(G, pid, false);
    case "graveyardBoth":
      return graveyardMoves(G, pid, true);
    case "selectBoardCardOwn":
      return selectBoardMoves(G, pid, "own");
    case "selectBoardCardOpponent":
      return selectBoardMoves(G, pid, "opponent");
    case "default":
    default:
      return defaultMoves(G, pid);
  }
}
