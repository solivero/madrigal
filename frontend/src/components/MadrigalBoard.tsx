import * as React from "react";
import { Ctx } from "boardgame.io";
import {
  GameState,
  Card,
  Board,
  Player,
  CardSlot,
} from "@madrigal/core/dist/models";
import { range } from "lodash";
import _ from "lodash";
import Modal from "react-modal";
import { BoardProps } from "boardgame.io/dist/types/packages/react";

interface Props {
  moves: any;
  events: any;
  G: GameState;
  playerID: string | null;
  ctx: Ctx;
  isMultiplayer: boolean;
  isActive: boolean;
}

const cardStyle: React.CSSProperties = {
  border: "2px solid #555",
  borderRadius: "5px",
  width: "60px",
  height: "90px",
  // lineHeight: '20px',
  textAlign: "center",
  margin: 3,
  backgroundColor: "darkgray",
  backgroundImage: "url(cardimages/default.jpg)",
  backgroundSize: "100%",
  outlineStyle: "solid",
  outlineColor: "transparent",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const cardBacksideStyle: React.CSSProperties = {
  border: "2px solid #555",
  borderRadius: "5px",
  width: "60px",
  height: "90px",
  textAlign: "center",
  backgroundColor: "lightgray",
  margin: 20,
};

const CardComp = ({ card, selected }: { card: Card; selected: boolean }) => (
  <div
    style={{
      ...cardStyle,
      borderColor: card.color,
      backgroundImage: `url(${card.imageUrl})`,
      outlineWidth: selected ? 2 : 0,
      outlineColor: selected ? "white" : "transparent",
      transform: card.color === "neutral" ? "rotate(90deg)" : "none",
    }}
  >
    <span style={{ fontSize: "80%" }}>{card.name}</span>
    <span style={{ color: card.points > card.basePoints ? "gold" : "inherit" }}>
      {card.points}
    </span>
  </div>
);

interface PlayerHandCardProps {
  card: Card;
  onSelect: (card: Card) => void;
  selected: boolean;
  hidden: boolean;
  player: Player;
}

const PlayerHandCardComp = ({
  card,
  onSelect,
  selected,
  hidden,
  player,
}: PlayerHandCardProps) => {
  const style = {
    ...cardStyle,
    borderColor: hidden ? "transparent" : card.color,
    outlineWidth: selected ? 2 : 0,
    outlineColor: selected ? "white" : "transparent",
    backgroundImage: hidden ? "" : `url(${card.imageUrl})`,
  };
  return (
    <div
      className={"Card-Hand-Bottom"}
      style={style}
      onClick={() => !hidden && onSelect(card)}
    >
      {!hidden && (
        <>
          <span style={{ fontSize: "80%" }}>{card.name}</span>
          <span>{card.points}</span>
        </>
      )}
    </div>
  );
};

function PlayerHand(props: {
  player: Player;
  hand: Card[];
  hidden?: boolean;
  onSelect?: (card: Card) => void;
  activeCardId?: string;
}) {
  return (
    <div style={{ margin: "auto", display: "flex", justifyContent: "center" }}>
      {props.hand.map((card) => (
        <PlayerHandCardComp
          key={card.id}
          card={card}
          hidden={Boolean(props.hidden)}
          onSelect={props.onSelect || (() => {})}
          selected={card.id === props.activeCardId}
          player={props.player}
        />
      ))}
    </div>
  );
}

const cardSlotStyle: React.CSSProperties = {
  border: "2px solid #555",
  borderRadius: "2px",
  width: "70px",
  height: "100px",
  lineHeight: "20px",
  textAlign: "center",
};

function CardSlotComp({
  cardSlot,
  onClick,
  activeCardId,
}: {
  cardSlot: CardSlot;
  onClick: (cardSlot: CardSlot) => void;
  activeCardId?: string;
}) {
  const isNeutral = cardSlot.color === "neutral";
  const style = {
    ...cardSlotStyle,
    borderColor: cardSlot.color,
    backgroundColor: "rgb(145,145,145, 0.5)",
    // transform: isNeutral ? "rotate(90deg)" : "none",
  };
  return (
    <td style={style} onClick={() => onClick(cardSlot)}>
      {cardSlot.card && (
        <CardComp
          card={cardSlot.card}
          selected={cardSlot.card?.id === activeCardId}
        />
      )}
    </td>
  );
}

function PlayerBoard(props: {
  isOpponent: boolean;
  board: Board;
  onClickSlot: (cardSlot: CardSlot) => void;
  activeCardId?: string;
}) {
  const rows = range(props.board.rows);
  const rowSlots = rows.map((row) => {
    const startIndex = row * props.board.cols;
    const orderedCardSlots = props.isOpponent
      ? props.board.cardSlots.slice().reverse()
      : props.board.cardSlots;
    const slots = orderedCardSlots.slice(
      startIndex,
      startIndex + props.board.cols
    );
    return slots.map((cardSlot) => (
      <CardSlotComp
        key={cardSlot.index}
        onClick={props.onClickSlot}
        cardSlot={cardSlot}
        activeCardId={props.activeCardId}
      />
    ));
  });
  const playerBoard = rowSlots.map((cardSlots, i) => (
    <tr key={i}>{cardSlots}</tr>
  ));
  return (
    <table
      id={`board-${props.isOpponent ? "opponent" : "player"}`}
      style={{ margin: "auto" }}
    >
      <tbody>{playerBoard}</tbody>
    </table>
  );
}
function Graveyard({ graveyard }: { graveyard: Card[] }) {
  return (
    <div style={graveyard.length ? cardBacksideStyle : cardSlotStyle}>
      <p>Graveyard</p>
      <p>{graveyard.length}</p>
    </div>
  );
}

function Deck({ deck }: { deck: Card[] }) {
  return (
    <div style={cardBacksideStyle}>
      <p>Deck</p>
      <p>{deck.length}</p>
    </div>
  );
}

function Chat({
  sendChatMessage,
  chatMessages,
}: Pick<BoardProps, "sendChatMessage" | "chatMessages">) {
  const [newMessage, setMessage] = React.useState("");
  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, .5)",
        width: 200,
        float: "left",
        color: "white",
        display: "",
      }}
    >
      <h2>Chat</h2>
      {chatMessages.map((message) => (
        <div key={message.id}>
          {new Date(message.payload.time).toLocaleTimeString()} {message.sender}
          : {message.payload.text}
        </div>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendChatMessage({
            text: newMessage,
            time: Date.now(),
          });
          setMessage("");
        }}
      >
        <label>
          Message:
          <textarea
            value={newMessage}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <input type="submit" value="Send" />
      </form>
    </div>
  );
}

function MadrigalBoard({
  G,
  ctx,
  moves,
  playerID,
  sendChatMessage,
  chatMessages,
}: BoardProps) {
  const currentPlayerId = ctx.currentPlayer as Player;
  const activePlayerId = playerID as Player;
  const player = G.players[activePlayerId];
  const opponentPlayerId = activePlayerId === "0" ? "1" : "0";
  const opponent = G.players[opponentPlayerId];
  const [activeCardId, setActiveCardId] = React.useState<string>("");
  const [activeCardPlayer, setActiveCardPlayer] =
    React.useState<Player>(activePlayerId);
  const selectCard = (card: Card, player: Player) => {
    if (currentPlayerId === activePlayerId) {
      if (card.id === activeCardId) {
        setActiveCardId("");
      } else if (card.id) {
        console.log("Selected card", card.id);
        setActiveCardId(card.id);
        setActiveCardPlayer(player);
      }
    }
  };
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const playerIsInStage = (player: Player, stage: string | null) =>
    ctx.activePlayers && ctx.activePlayers[player] == stage;
  React.useEffect(() => {
    const openGraveyard =
      playerIsInStage(activePlayerId, "graveyardOwn") ||
      playerIsInStage(activePlayerId, "graveyardBoth");
    setIsOpen(Boolean(openGraveyard));
  }, [ctx.activePlayers, activePlayerId]);
  const afterOpenModal = () => {}; // Visual effect?
  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
    },
  };
  const playActiveCardFromHand = (cardSlot: CardSlot) => {
    try {
      moves.playCardFromHand(activeCardId, cardSlot.index, cardSlot.player);
      setActiveCardId("");
    } catch (err) {
      console.log("Err in playActiveCardFromHand");
      console.error(err);
    }
  };
  const playActiveCardFromBoard = (cardSlot: CardSlot) => {
    try {
      moves.playCardFromBoard(
        activeCardId,
        cardSlot.index,
        cardSlot.player,
        activeCardPlayer
      );
      setActiveCardId("");
    } catch (err) {
      console.log("Err in playActiveCardFromBoard");
      console.error(err);
    }
  };
  const stageHelp: { [stage: string]: string } = {
    default: "Play a card or pass",
    selectBoardCardOwn: "Select card on your own board",
    selectBoardCardOpponent: "Select card on your opponent's board",
    graveyardOwn: "Select card from your own graveyard",
    graveyardBoth: "Select card from any player's graveyard",
  };
  console.log({ currentPlayerId, opponentPlayerId, activePlayerId });
  const getHelpText = () => {
    if (currentPlayerId !== activePlayerId) {
      return "Wait for other player to play";
    }
    const currentStage = ctx.activePlayers && ctx.activePlayers[activePlayerId];
    return (
      (currentStage && stageHelp[currentStage]) ||
      "Unknown state. Please reset game"
    );
  };

  return (
    <div
      style={{
        // position: "fixed",
        overflow: "auto",
        width: "100%",
        height: "100vh",
        backgroundImage: 'url("background.jpg")',
        backgroundSize: "cover",
      }}
    >
      <Chat sendChatMessage={sendChatMessage} chatMessages={chatMessages} />
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={() => setIsOpen(false)}
        style={customStyles}
        contentLabel="Graveyard"
      >
        <div style={{ margin: "25% auto", width: "80%" }}>
          {playerIsInStage(activePlayerId, "graveyardBoth") && (
            <>
              <p>Opponent graveyard</p>
              <PlayerHand
                player={opponentPlayerId}
                hand={G.players[opponentPlayerId]?.graveyard}
                onSelect={(card) =>
                  moves.selectGraveyardCard(card.id || "", opponentPlayerId)
                }
                hidden={false}
              />
            </>
          )}
          <p>Your graveyard</p>
          <PlayerHand
            player={activePlayerId}
            hand={G.players[activePlayerId]?.graveyard}
            onSelect={(card) =>
              moves.selectGraveyardCard(card.id || "", activePlayerId)
            }
            hidden={false}
          />
        </div>
      </Modal>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          id="left-col"
          style={{
            paddingRight: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2>Games {opponent.games}</h2>
            <h2>Points {opponent.points}</h2>
            {opponent.passed && <h2>Passed</h2>}
          </div>
          <Deck deck={G.deck} />
          <div>
            <h4 style={{ color: "white", width: 150, overflowWrap: "normal" }}>
              {getHelpText()}
            </h4>
            {player.passed && <h2>Passed</h2>}
            <h2>Points {player.points}</h2>
            <h2>Games {player.games}</h2>
          </div>
        </div>
        <div id="mid-col">
          <PlayerHand player={opponentPlayerId} hand={opponent.hand} hidden />
          <div style={{ height: 10 }}></div>
          <PlayerBoard
            isOpponent={true}
            board={opponent.board}
            activeCardId={activeCardId}
            onClickSlot={(cardSlot) => {
              const selectOwnBoard = playerIsInStage(
                currentPlayerId,
                "selectBoardCardOwn"
              );
              const selectOpponentBoard = playerIsInStage(
                currentPlayerId,
                "selectBoardCardOpponent"
              );

              if (selectOpponentBoard) {
                if (cardSlot.card) {
                  selectCard(cardSlot.card, cardSlot.player);
                  return;
                }
              }
              if ((selectOpponentBoard || selectOwnBoard) && activeCardId) {
                playActiveCardFromBoard(cardSlot);
              } else {
                playActiveCardFromHand(cardSlot);
              }
            }}
          />
          <div style={{ height: 40 }}>
            {ctx.gameover && (
              <h1 style={{ textAlign: "center" }}>{ctx.gameover}</h1>
            )}
          </div>
          <PlayerBoard
            isOpponent={false}
            board={player.board}
            activeCardId={activeCardId}
            onClickSlot={(cardSlot) => {
              const inSelectOwnStage = playerIsInStage(
                currentPlayerId,
                "selectBoardCardOwn"
              );
              const inSelectOpponentStage = playerIsInStage(
                currentPlayerId,
                "selectBoardCardOpponent"
              );
              if (inSelectOwnStage) {
                console.log("Should select own");
                if (cardSlot.card) {
                  console.log(
                    "Attempt select card",
                    cardSlot.card.name,
                    cardSlot.card.id
                  );
                  return selectCard(cardSlot.card, cardSlot.player);
                }
              }
              if ((inSelectOpponentStage || inSelectOwnStage) && activeCardId) {
                playActiveCardFromBoard(cardSlot);
              } else {
                playActiveCardFromHand(cardSlot);
              }
            }}
          />
          <div style={{ height: 10 }}></div>
          <PlayerHand
            player={activePlayerId}
            hand={player.hand}
            onSelect={(card) => {
              if (playerIsInStage(activePlayerId, "default")) {
                selectCard(card, activePlayerId);
              }
            }}
            activeCardId={activeCardId}
          />
        </div>
        <div
          id="right-col"
          style={{
            paddingLeft: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Graveyard graveyard={opponent.graveyard} />
          {/* <ScoreBoard p0={p0} p1={p1} /> */}
          <button
            onClick={() => moves.pass()}
            style={{ height: 60, borderRadius: 5, fontSize: 15 }}
          >
            Pass
          </button>
          <Graveyard graveyard={player.graveyard} />
        </div>
      </div>
    </div>
  );
}
export { MadrigalBoard };
