import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hand as HandIcon, Hourglass } from "lucide-react";
import type { BoardProps } from "boardgame.io/dist/types/packages/react";
import type {
  Card,
  CardSlot as CardSlotType,
  GameState,
  Player,
} from "@madrigal/core/dist/models";
import * as madrigalCards from "@madrigal/core/dist/cards";
const { getCardDef } = madrigalCards;
import { PlayerBoard } from "./PlayerBoard";
import { Hand } from "./Hand";
import { PlayerHUD } from "./PlayerHUD";
import { CardDetail } from "./CardDetail";
import { EndGameOverlay } from "./EndGameOverlay";
import { Pile } from "./Pile";
import { Modal } from "../ui/Modal";
import { VolumePicker } from "../ui/VolumePicker";
import { useIsMobile } from "../../hooks/useResponsive";
import { useGameSounds } from "../../hooks/useGameSounds";
import { useVolume } from "../../hooks/useVolume";
import { cn } from "../../lib/cn";

const STAGE_HELP: Record<string, string> = {
  default: "Play a card or pass",
  selectBoardCardOwn: "Select a card on your own board",
  selectBoardCardOpponent: "Select a card on the opponent's board",
  graveyardOwn: "Pick a card from your graveyard",
  graveyardBoth: "Pick a card from any graveyard",
};

export function MadrigalBoard(props: BoardProps<GameState>) {
  const { G, ctx, moves, playerID, sendChatMessage, chatMessages, log } = props;
  const isMobile = useIsMobile();
  const { muted, setMuted, volume, setVolume } = useVolume();
  const [activeCardId, setActiveCardId] = useState("");
  const [activeCardPlayer, setActiveCardPlayer] = useState<Player>(
    (playerID ?? "0") as Player
  );
  const [detailCardId, setDetailCardId] = useState("");
  const [showGraveyards, setShowGraveyards] = useState(false);
  const [showOpponentHand, setShowOpponentHand] = useState(false);

  const activePlayerId = (playerID ?? "0") as Player;
  const currentPlayerId = ctx.currentPlayer as Player;
  const opponentPlayerId: Player = activePlayerId === "0" ? "1" : "0";
  const player = G.players[activePlayerId];
  const opponent = G.players[opponentPlayerId];
  const isMyTurn = currentPlayerId === activePlayerId;

  // Sound effects for moves — cached Howl instances + procedural fallback.
  useGameSounds({ G, ctx, log, muted });

  // Graveyard auto-open during graveyard stage
  useEffect(() => {
    const stage = ctx.activePlayers?.[activePlayerId];
    setShowGraveyards(stage === "graveyardOwn" || stage === "graveyardBoth");
  }, [ctx.activePlayers, activePlayerId]);

  const playerInStage = (p: Player, s: string) =>
    ctx.activePlayers?.[p] === s;

  function selectCard(card: Card, player: Player) {
    if (!isMyTurn) return;
    if (card.id === activeCardId) {
      setActiveCardId("");
    } else if (card.id) {
      setActiveCardId(card.id);
      setActiveCardPlayer(player);
    }
  }

  function playFromHand(slot: CardSlotType, cardId = activeCardId) {
    try {
      moves.playCardFromHand(cardId, slot.index, slot.player);
      setActiveCardId("");
    } catch (e) {
      console.error(e);
    }
  }

  // Drag-and-drop from hand. On drag end, hit-test the pointer against the
  // board slots; if the pointer is over a valid slot, play the card there.
  function handleDragStart(card: Card) {
    if (!isMyTurn) return;
    if (!playerInStage(activePlayerId, "default")) return;
    setActiveCardId(card.id);
    setActiveCardPlayer(activePlayerId);
    setDetailCardId(card.id);
  }
  function handleDragEnd(card: Card, point: { x: number; y: number }) {
    if (!isMyTurn) return;
    if (!playerInStage(activePlayerId, "default")) return;
    // Find the slot element under the drop point
    const el = document.elementFromPoint(point.x, point.y);
    const slotEl = el?.closest("[role=gridcell]") as HTMLElement | null;
    const slotIndexAttr = slotEl?.getAttribute("data-slot-index");
    if (!slotIndexAttr) return; // missed — let snap-back animate
    const slotIndex = Number(slotIndexAttr);
    const slotPlayer = slotEl?.getAttribute("data-slot-player") as Player | null;
    if (slotPlayer == null) return;
    // Reconstruct the CardSlot reference from G to call playFromHand
    const slot = G.players[slotPlayer].board.cardSlots[slotIndex];
    if (slot.card) return; // can't play onto occupied
    playFromHand(slot, card.id);
  }

  function playFromBoard(slot: CardSlotType) {
    try {
      moves.playCardFromBoard(
        activeCardId,
        slot.index,
        slot.player,
        activeCardPlayer
      );
      setActiveCardId("");
    } catch (e) {
      console.error(e);
    }
  }

  function handleBoardClick(slot: CardSlotType, side: "own" | "opp") {
    if (slot.card) setDetailCardId(slot.card.id);
    const selOwn = playerInStage(currentPlayerId, "selectBoardCardOwn");
    const selOpp = playerInStage(currentPlayerId, "selectBoardCardOpponent");

    if (side === "opp" && selOpp && slot.card) {
      return selectCard(slot.card, slot.player);
    }
    if (side === "own" && selOwn && slot.card) {
      return selectCard(slot.card, slot.player);
    }
    if ((selOwn || selOpp) && activeCardId) {
      return playFromBoard(slot);
    }
    if (activeCardId) {
      return playFromHand(slot);
    }
  }

  const helpText = ctx.gameover
    ? "Game over!"
    : !isMyTurn
      ? "Awaiting thy opponent…"
      : STAGE_HELP[ctx.activePlayers?.[activePlayerId] ?? "default"] ??
        STAGE_HELP.default;

  // Round = game1 / game2 / game3. Derive from ctx.phase or accumulated wins.
  const currentRound = (() => {
    if (ctx.phase === "game1") return 1;
    if (ctx.phase === "game2") return 2;
    if (ctx.phase === "game3") return 3;
    return Math.min(3, player.games + opponent.games + 1);
  })();

  // Transition overlay when round changes
  const [roundTransition, setRoundTransition] = useState<null | {
    round: number;
    winner: "you" | "opp" | "none";
  }>(null);
  const prevPhaseRef = useRef(ctx.phase);
  const prevGamesRef = useRef({ me: player.games, opp: opponent.games });
  useEffect(() => {
    if (prevPhaseRef.current !== ctx.phase && ctx.phase) {
      const newRound = ctx.phase === "game1" ? 1 : ctx.phase === "game2" ? 2 : 3;
      const prevMe = prevGamesRef.current.me;
      const prevOpp = prevGamesRef.current.opp;
      const winner =
        player.games > prevMe ? "you" : opponent.games > prevOpp ? "opp" : "none";
      if (newRound > 1) {
        setRoundTransition({ round: newRound, winner });
        const t = setTimeout(() => setRoundTransition(null), 2800);
        prevPhaseRef.current = ctx.phase;
        prevGamesRef.current = { me: player.games, opp: opponent.games };
        return () => clearTimeout(t);
      }
    }
    prevPhaseRef.current = ctx.phase;
    prevGamesRef.current = { me: player.games, opp: opponent.games };
  }, [ctx.phase, player.games, opponent.games]);

  // Track the slot index of the opponent's most recent card placement so we
  // can flash a gold glow on it. The slot stays "flashed" for a short window.
  const [lastOpponentSlot, setLastOpponentSlot] = useState<number | null>(null);
  const lastSlotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevOppCardCountRef = useRef(
    opponent.board.cardSlots.filter((s) => s.card).length
  );
  useEffect(() => {
    const currentCount = opponent.board.cardSlots.filter((s) => s.card).length;
    if (currentCount > prevOppCardCountRef.current) {
      // find the newest slot — assume it's the one we now have but didn't before.
      // We don't have a diff, but board.history's first entry is the most-recent placement.
      const recent = opponent.board.history[0];
      if (recent) {
        setLastOpponentSlot(recent.boardCell);
        if (lastSlotTimerRef.current) clearTimeout(lastSlotTimerRef.current);
        lastSlotTimerRef.current = setTimeout(
          () => setLastOpponentSlot(null),
          5400
        );
      }
    }
    prevOppCardCountRef.current = currentCount;
  }, [opponent.board.cardSlots, opponent.board.history]);

  // Toast when opponent transitions to passed
  const [opponentJustPassed, setOpponentJustPassed] = useState(false);
  const prevOpponentPassedRef = useRef(opponent.passed);
  useEffect(() => {
    if (!prevOpponentPassedRef.current && opponent.passed && !ctx.gameover) {
      setOpponentJustPassed(true);
      const t = setTimeout(() => setOpponentJustPassed(false), 2400);
      prevOpponentPassedRef.current = opponent.passed;
      return () => clearTimeout(t);
    }
    prevOpponentPassedRef.current = opponent.passed;
  }, [opponent.passed, ctx.gameover]);

  const resolvedDetailCard: Card | undefined =
    player.hand.find((c) => c.id === detailCardId) ??
    [
      ...player.board.cardSlots,
      ...opponent.board.cardSlots,
    ].find((s) => s.card?.id === detailCardId)?.card;

  // Compute valid drop targets for the currently-selected card.
  const { ownTargets, oppTargets } = useMemo(() => {
    const empty = { ownTargets: new Set<number>(), oppTargets: new Set<number>() };
    if (!activeCardId || !isMyTurn) return empty;
    const stage = ctx.activePlayers?.[activePlayerId] ?? "default";
    // Only show targets for placement stages
    if (
      stage !== "default" &&
      stage !== "selectBoardCardOwn" &&
      stage !== "selectBoardCardOpponent"
    ) {
      return empty;
    }
    // Find the active card in hand or on either board
    const fromHand = player.hand.find((c) => c.id === activeCardId);
    const fromBoardSlot = [
      ...player.board.cardSlots,
      ...opponent.board.cardSlots,
    ].find((s) => s.card?.id === activeCardId);
    const card = fromHand ?? fromBoardSlot?.card;
    if (!card) return empty;
    let def;
    try {
      def = getCardDef(card.name);
    } catch {
      return empty;
    }
    const valid = def.validMoves(card, player.board, opponent.board);
    const own = new Set<number>();
    const opp = new Set<number>();
    for (const idx of valid.player) {
      if (!player.board.cardSlots[idx]?.card) own.add(idx);
    }
    for (const idx of valid.opponent) {
      if (!opponent.board.cardSlots[idx]?.card) opp.add(idx);
    }
    return { ownTargets: own, oppTargets: opp };
  }, [activeCardId, isMyTurn, ctx.activePlayers, activePlayerId, player, opponent]);

  return (
    <div className="table-felt h-screen w-full overflow-hidden">
      {/* Outer wrapper — fills the viewport vertically so the board (flex-1)
          grows to take whatever space the HUDs + hands don't claim. On md+
          we pad horizontally by 160px to clear the sidebar ornaments. */}
      <div className="mx-auto flex h-full max-w-[1280px] flex-col gap-1.5 px-3 py-2 sm:gap-2 sm:px-5 lg:px-[150px]">
        {/* Top row: opponent HUD centered, controls floating right */}
        <header className="relative flex items-center justify-center safe-top">
          <PlayerHUD
            player={opponent}
            name="Opponent"
            isCurrent={currentPlayerId === opponentPlayerId}
            side="top"
          />
          <div className="absolute right-16 top-0 flex items-center gap-1.5 sm:right-20">
            <VolumePicker
              muted={muted}
              volume={volume}
              onMutedChange={setMuted}
              onVolumeChange={setVolume}
            />
            <button
              type="button"
              onClick={() => setShowOpponentHand(true)}
              aria-label="Peek opponent's hand"
              className="rounded-full border border-gold-dark/50 bg-wood-dark/70 p-1.5 text-parchment-dark hover:border-gold hover:text-parchment sm:hidden"
            >
              <HandIcon className="size-3.5" />
            </button>
          </div>
        </header>

        {/* Opponent hand (desktop) */}
        <div className="hidden justify-center sm:flex">
          <div className="max-w-[760px]">
            <Hand
              hand={opponent.hand}
              hidden
              label="Opponent hand"
              size="xs"
            />
          </div>
        </div>

        {/* Main play area — flex-1 so the board fills all available height */}
        <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[64px_minmax(0,1fr)]">
          {/* Left column: piles at top, Pass anchored to the bottom */}
          <aside className="hidden flex-col items-center gap-2 py-2 md:flex">
            <Pile label="Deck" count={G.deck.length} variant="deck" />
            <Pile
              label="Opp grave"
              count={opponent.graveyard.length}
              variant="graveyard"
              onClick={() => setShowGraveyards(true)}
            />
            <Pile
              label="Your grave"
              count={player.graveyard.length}
              variant="graveyard"
              onClick={() => setShowGraveyards(true)}
            />
            {/* mt-auto pushes Pass to the bottom of the column */}
            <button
              type="button"
              onClick={() => moves.pass()}
              disabled={!isMyTurn}
              className="font-display mt-auto w-11 rounded-full border border-gold-dark/70 bg-burgundy py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-parchment shadow-md hover:bg-burgundy-dark disabled:opacity-40"
            >
              Pass
            </button>
          </aside>

          {/* Center: the framed board */}
          <section className="board-frame flex flex-col items-stretch justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5">
            <span aria-hidden className="motes" />
            <span aria-hidden className="frame-corner-tr" />
            <span aria-hidden className="frame-corner-bl" />
            {/* Mobile-only piles bar above opponent board */}
            <div className="flex items-center justify-center gap-2 md:hidden">
              <Pile label="Deck" count={G.deck.length} variant="deck" />
              <Pile
                label="Opp grave"
                count={opponent.graveyard.length}
                variant="graveyard"
                onClick={() => setShowGraveyards(true)}
              />
              <Pile
                label="Your grave"
                count={player.graveyard.length}
                variant="graveyard"
                onClick={() => setShowGraveyards(true)}
              />
              <button
                type="button"
                onClick={() => moves.pass()}
                disabled={!isMyTurn}
                className="font-display rounded-full border border-gold-dark/70 bg-burgundy px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-parchment hover:bg-burgundy-dark disabled:opacity-40"
              >
                Pass
              </button>
            </div>

            <PlayerBoard
              board={opponent.board}
              isOpponent
              activeCardId={activeCardId}
              validTargets={oppTargets}
              lastMoveSlot={lastOpponentSlot}
              onClickSlot={(s) => handleBoardClick(s, "opp")}
            />

            <div
              className={cn(
                "river-divider relative flex items-center justify-center py-2",
                "river-divider--hearth"
              )}
              data-round={currentRound}
            >
              {/* Round indicator — fixed width so changing dots don't shift layout */}
              <div
                className="font-display absolute left-2 top-1/2 flex -translate-y-1/2 items-center justify-between gap-2 rounded-full border border-gold-dark/60 bg-wood-dark/85 px-3 py-1 text-[0.6rem] uppercase tracking-[0.22em] text-parchment-dark backdrop-blur-sm sm:left-3"
                style={{ minWidth: "9.5rem" }}
              >
                <span className="text-candle">Round</span>
                <span className="font-display flex items-center gap-0.5">
                  {[1, 2, 3].map((r) => (
                    <span
                      key={r}
                      className={cn(
                        "size-1.5 rounded-full transition",
                        r < currentRound
                          ? "bg-gold-dark"
                          : r === currentRound
                            ? "bg-candle shadow-[0_0_6px_rgba(255,216,122,0.9)]"
                            : "bg-gold-dark/30"
                      )}
                    />
                  ))}
                </span>
                <span className="text-parchment tabular-nums">{currentRound}/3</span>
              </div>

              {/* Help chip — fixed width + nowrap, hourglass always rendered
                  (visibility toggled). No more horizontal jitter between turns. */}
              <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative flex items-center justify-center gap-2 rounded-full border px-4 py-1 font-display text-[0.65rem] uppercase tracking-[0.22em] backdrop-blur-sm whitespace-nowrap",
                  isMyTurn
                    ? "border-candle bg-burgundy/80 text-candle shadow-[0_0_20px_rgba(255,216,122,0.35)]"
                    : "border-gold-dark/50 bg-wood-dark/85 text-parchment-dark"
                )}
                style={{ minWidth: "18rem" }}
              >
                <Hourglass
                  className={cn(
                    "size-3 animate-spin [animation-duration:2.4s]",
                    (isMyTurn || ctx.gameover) && "invisible"
                  )}
                />
                <span className="text-center">{helpText}</span>
              </motion.div>
            </div>

            <PlayerBoard
              board={player.board}
              isOpponent={false}
              activeCardId={activeCardId}
              validTargets={ownTargets}
              onClickSlot={(s) => handleBoardClick(s, "own")}
            />
          </section>

        </div>

        {/* Floating card detail popover (desktop/tablet) */}
        <CardDetail card={resolvedDetailCard} floating />

        {/* Round-transition overlay */}
        <AnimatePresence>
          {roundTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] flex items-center justify-center bg-black/65 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: -10 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="parchment-panel rounded-xl px-12 py-8 text-center shadow-2xl"
              >
                <p className="font-display text-xs uppercase tracking-[0.3em] text-ink-soft">
                  {roundTransition.winner === "you"
                    ? "Thou took the round"
                    : roundTransition.winner === "opp"
                      ? "Opponent took the round"
                      : "The bell tolls"}
                </p>
                <h2 className="font-display gilded mt-2 text-6xl">
                  Round {roundTransition.round}
                </h2>
                <p className="font-serif mt-2 italic text-ink-soft">
                  {roundTransition.round === 3
                    ? "The decisive round."
                    : "Sharpen thy steel."}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Opponent-passed toast banner */}
        <AnimatePresence>
          {opponentJustPassed && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="font-display fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-full border-2 border-burgundy bg-parchment/95 px-6 py-2 text-sm uppercase tracking-[0.22em] text-burgundy shadow-2xl"
            >
              Opponent passed
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player HUD floating between board and hand */}
        <div className="flex justify-center">
          <PlayerHUD
            player={player}
            name="You"
            isCurrent={isMyTurn}
            side="bottom"
          />
        </div>

        {/* Player hand */}
        <div className="flex justify-center">
          <div className="max-w-[920px]">
            <Hand
              hand={player.hand}
              activeCardId={activeCardId}
              label="Your hand"
              curved
              draggable={
                isMyTurn && playerInStage(activePlayerId, "default")
              }
              onHover={(c) => setDetailCardId(c?.id ?? "")}
              onSelect={(c) => {
                setDetailCardId(c.id);
                if (playerInStage(activePlayerId, "default")) {
                  selectCard(c, activePlayerId);
                }
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        </div>

        {/* Mobile detail */}
        {isMobile && resolvedDetailCard && (
          <div className="px-2 pb-3 safe-bottom">
            <CardDetail card={resolvedDetailCard} />
          </div>
        )}
      </div>

      <Modal
        open={showGraveyards}
        onClose={() => setShowGraveyards(false)}
        title="Graveyards"
      >
        {playerInStage(activePlayerId, "graveyardBoth") && (
          <>
            <h3 className="font-display mb-2 text-sm uppercase tracking-widest text-ink-soft">
              Opponent
            </h3>
            <Hand
              hand={opponent.graveyard}
              onSelect={(c) =>
                moves.selectGraveyardCard(c.id || "", opponentPlayerId)
              }
            />
          </>
        )}
        <h3 className="font-display mb-2 mt-4 text-sm uppercase tracking-widest text-ink-soft">
          Yours
        </h3>
        <Hand
          hand={player.graveyard}
          onSelect={(c) =>
            moves.selectGraveyardCard(c.id || "", activePlayerId)
          }
        />
      </Modal>

      <Modal
        open={showOpponentHand}
        onClose={() => setShowOpponentHand(false)}
        title="Opponent's hand"
      >
        <Hand hand={opponent.hand} hidden />
      </Modal>

      <AnimatePresence>
        {ctx.gameover !== undefined && (
          <EndGameOverlay
            G={G}
            gameover={ctx.gameover}
            playerID={activePlayerId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
