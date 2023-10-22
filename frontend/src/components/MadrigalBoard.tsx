import * as React from "react";
import { Ctx } from "boardgame.io";
import {
  GameState,
  Card,
  Board,
  Player,
  CardSlot,
  GameEvent,
  CardName,
} from "@madrigal/core/dist/models";
import { range } from "lodash";
import _ from "lodash";
import Modal from "react-modal";
import { BoardProps } from "boardgame.io/dist/types/packages/react";
import { Howl, Howler } from "howler";
import { Tooltip } from "react-tooltip";

interface Props {
  moves: any;
  events: any;
  G: GameState;
  playerID: string | null;
  ctx: Ctx;
  isMultiplayer: boolean;
  isActive: boolean;
}

const heroDescription =
  "Påverkas inte av effekter flaggor, kombinationer, dimma. Buffs från bönder och smeder gäller för hjältar ";
const cardDescriptions: Record<CardName, string> = {
  Spy: "Lägg på motståndarens sida och ta upp ett kort från din egen eller motståndarens slänghög. Om inga kort finns i slänghögen, ges ingen effekt. Motståndaren väljer placering för spionen i raden med motsvarande färg. Annars läggs spion på spelarens sida med värde 1 utan att ta upp kort",
  Thief:
    "Lägg på motståndarens sida. Ta upp 2 kort från din egen slänghög. Motståndaren väljer placering för spionen i raden med motsvarande färg om möjligt. Annars läggs spoion på spelarens sida med värde 2 utan att ta upp kort",
  Fisherman:
    "Ta upp kort högst från leken. Motståndaren kan med fördel säga “finns i sjön” för maximal effekt",
  Farmer:
    "Höjer alla hjältekort och präster (7, 10, 11, 12, 13) på egen planhalva med 1+ i värde. Kombinera 2 bönder multiplicerar effekter så att varje bonde ger 2+ i värde. Samma för 3 osv ",
  Smith:
    "Höjer varje kort som befinner sig i samma rad med 1+ i värde (exklusive präst. Dom behöver inga vapen) ",
  Merchant:
    "Lägg på motståndarens sida och ta valfritt utlagt kort från motståndaren till egen sida. Motståndaren placerar själv handelsmannen utifrån färg. Effekter av taget kort appliceras direkt. Om motståndarens rad med handelsmannens färg är fylld så måste ett kort med denna färg bytas så att handelsmannen får plats",
  Priest:
    "Lägg på egen spelplan och ta därefter upp valfritt kort från egen slänghög eller ett kort högst från kortleken. Prästkort påverkas precis som hjältar varken av kombinationer, effekter eller flaggor",
  Warrior: "Det enda kortet utan effekt",
  "Field marshal":
    "Flytta valfritt kort på egen planhalva till annan giltig plats. Guldkort kan flytta rad",
  Treasurer: heroDescription,
  Queen: heroDescription,
  King: heroDescription,
  Standard:
    "Läggs på planen som en hjälte med 13 poäng eller vid sidan om raden som effekt och dubblerar då radens poäng (exkl hjältar, präster och deras buffs). Dubblerar kortens värde inkl buffs som kombo, smed etc. Gäller bara egen sidas rad. Flaggor kan läggas på båda sidor om en rad (tex blå och guld) om rum finns i sidoplatserna",
  Fog: "Dimma. Tar bort alla poäng (exkl hjältar) från en rad med samma färg hos båda spelare ",
  Jester:
    "Neutraliserar alla nuvarande och kommande effekter, dimma (Z), flaggor (13), kombinationer och buffs på raden den läggs på. Kan läggas på egen eller motståndarens sida",
};

function getStorageUrl(path: string) {
  const bucket =
    process.env.GOOGLE_CLOUD_PROJECT || "madrigal-online.appspot.com";
  const baseImgUrl = "https://storage.googleapis.com";
  return `${baseImgUrl}/${bucket}/${path}`;
}

const getImageUrl = (color: string, name: string) =>
  getStorageUrl(`card_images/${name}-${color}.jpg`);

const cardWidth = 74;
const cardHeight = cardWidth * 1.5;

const cardStyle: React.CSSProperties = {
  border: "2px solid #555",
  borderRadius: "5px",
  width: cardWidth,
  height: cardHeight,
  // lineHeight: '20px',
  color: "white",
  textAlign: "center",
  margin: 3,
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
  width: cardWidth,
  height: cardHeight,
  textAlign: "center",
  color: "white",
  backgroundImage: `url(${getStorageUrl("card_images/background-card.jpg")}`,
  backgroundSize: "100%",
  margin: 20,
};

const DetailedCard = ({ card }: { card: Card }) => (
  <div
    style={{
      width: cardWidth * 3,
      minHeight: cardHeight * 2,
      borderColor: card ? card.color : "none",
      borderRadius: 5,
      borderStyle: card ? "solid" : "none",
    }}
  >
    {card && (
      <div style={{ backgroundColor: "rgba(189, 189, 189, 0.5)" }}>
        <div
          style={{
            // ...cardStyle,
            width: cardWidth * 3,
            height: cardHeight * 3,
            backgroundSize: "100%",
            backgroundImage: card
              ? `url(${getImageUrl(card.color, card.normalizedName)})`
              : "",
          }}
        ></div>
        <div style={{ padding: 5 }}>
          <p style={{ fontSize: "130%" }}>{card.name}</p>
          <p>{cardDescriptions[card.name]}</p>
          <span>Base points: {card.basePoints}</span>
          <br />
          <span>Effects: </span>
          {Object.keys(card.effects).length == 0 ? (
            <span>
              none
              <br />
            </span>
          ) : (
            <>
              <table>
                <tbody>
                  {Object.entries(card.effects).map(([effect, points]) => (
                    <tr key={effect}>
                      <td>{effect}</td>
                      <td>
                        {points > 0 && "+"}
                        {points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <span
            style={{
              color: card.points > card.basePoints ? "gold" : "inherit",
            }}
          >
            <span>Points {card.points} </span>
          </span>
        </div>
      </div>
    )}
  </div>
);

const CardComp = ({ card, selected }: { card: Card; selected: boolean }) => (
  <div
    style={{
      ...cardStyle,
      borderColor: card.color,
      backgroundImage: `url(${getImageUrl(card.color, card.normalizedName)})`,
      outlineWidth: selected ? 2 : 0,
      outlineColor: selected ? "white" : "transparent",
      transform: card.color === "neutral" ? "rotate(90deg)" : "none",
    }}
  >
    <span style={{ fontSize: "80%" }}>{card.name}</span>
    <span style={{ color: card.points > card.basePoints ? "gold" : "inherit" }}>
      <span>
        {Object.keys(card.effects)
          .map((effect) => effect[0].toUpperCase())
          .join(" ")}
      </span>
      <br />
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
    backgroundImage: hidden
      ? `url(${getStorageUrl("card_images/background-card.jpg")}`
      : `url(${getImageUrl(card.color, card.normalizedName)})`,
  };
  return (
    <div
      className={"Card-Hand-Bottom"}
      style={style}
      onClick={() => !hidden && onSelect(card)}
      data-tooltip-id="my-tooltip"
      data-tooltip-content={cardDescriptions[card.name]}
      // data-tooltip-place="right"
    >
      {!hidden && (
        <>
          <span style={{ fontSize: "80%" }}>{card.name}</span>
          <span
            style={{
              width: "40%",
              margin: "0 auto",
              borderRadius: "50%",
              background: "gray",
            }}
          >
            {card.points}
          </span>
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
  width: cardWidth + 10,
  height: cardHeight + 10,
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
    <div>
      <div style={graveyard.length ? cardBacksideStyle : cardSlotStyle}>
        <p>Graveyard</p>
        <p>{graveyard.length}</p>
      </div>
    </div>
  );
}

function Deck({ deck }: { deck: Card[] }) {
  return (
    <div
      style={cardBacksideStyle}
      data-tooltip-content="WTF"
      data-tooltip-id="my-tooltip"
    >
      <p>Deck</p>
      <p>{deck.length}</p>
    </div>
  );
}

function EventLog({ events }: { events: GameEvent[] }) {
  if (!events) {
    return <div></div>;
  }
  const eventLogText = events.reduce(
    (logStr, event) =>
      `${new Date(event.time || 0).toLocaleTimeString()} ${event.player}: ${
        event.description
      }\n${logStr}`,
    ""
  );
  return (
    <div>
      <textarea
        readOnly
        rows={6}
        value={eventLogText}
        style={{ width: "100%" }}
      />
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
        width: "100%",
        color: "white",
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
        <label htmlFor="message">
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
  log,
}: BoardProps) {
  console.log("Render board");
  const lastMove = log
    .reverse()
    .find((entry) => entry.action.type === "MAKE_MOVE");
  const [soundsPlayed, setSoundsPlayed] = React.useState<{
    [moveHash: string]: boolean;
  }>({});
  const [detailedCardId, setDetailedCardId] = React.useState<string>("");
  if (lastMove) {
    console.log("LAST MOVE", lastMove);
    const moveArgs = lastMove.action.payload.args as any[];
    const moveType = lastMove.action.payload.type;
    if (["playCardFromHand", "playCardFromBoard"].includes(moveType)) {
      const [cardId, boardSlot, boardPlayer] = moveArgs;
      const soundId = moveArgs.join("-");
      if (!soundsPlayed[soundId]) {
        if (detailedCardId !== cardId) {
          setDetailedCardId(cardId);
        }
        const cardName =
          G.players[boardPlayer].board.cardSlots[boardSlot]?.card
            ?.normalizedName;
        if (cardName) {
          console.log("Not played yet", cardName, soundId);
          const sound = new Howl({
            src: [getStorageUrl(`sounds/${cardName}.mp3`)],
          });
          sound.play();
          setSoundsPlayed({ ...soundsPlayed, [soundId]: true });
        }
      }
    }
  }
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
    if (ctx.gameover) {
      return "Game over!";
    }
    if (currentPlayerId !== activePlayerId) {
      return "Wait for other player to play";
    }
    const currentStage = ctx.activePlayers && ctx.activePlayers[activePlayerId];
    return (
      (currentStage && stageHelp[currentStage]) ||
      "Unknown state. Please reset game"
    );
  };
  const detailedCard = [
    ...player.board.cardSlots,
    ...opponent.board.cardSlots,
  ].find((slot: any) => slot.card?.id === detailedCardId)?.card;

  return (
    <div
      style={{
        // position: "fixed",
        overflow: "auto",
        width: "100%",
        height: "100vh",
        backgroundImage: `url(${getStorageUrl("backgrounds/default.jpg")})`,
        backgroundSize: "cover",
      }}
    >
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          // alignItems: "center",
          alignContent: "space-between",
          height: "100%",
        }}
      >
        <div
          id="lllleft-col"
          style={{
            paddingRight: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 300,
          }}
        >
          <Chat sendChatMessage={sendChatMessage} chatMessages={chatMessages} />
          <EventLog events={G.events} />
        </div>
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
            {player.passed && <h2>Passed</h2>}
            <h2>Points {player.points}</h2>
            <h2>Games {player.games}</h2>
          </div>
        </div>
        <div
          id="mid-col"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <PlayerHand player={opponentPlayerId} hand={opponent.hand} hidden />
          <div style={{ height: 10 }}></div>
          <PlayerBoard
            isOpponent={true}
            board={opponent.board}
            activeCardId={activeCardId}
            onClickSlot={(cardSlot) => {
              if (cardSlot.card) {
                setDetailedCardId(cardSlot.card.id);
              }
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
            <h2 style={{ textAlign: "center" }}>{getHelpText()}</h2>
          </div>
          <PlayerBoard
            isOpponent={false}
            board={player.board}
            activeCardId={activeCardId}
            onClickSlot={(cardSlot) => {
              if (cardSlot.card) {
                console.log(cardSlot.card);
                setDetailedCardId(cardSlot.card.id);
              }
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
        <div
          id="rrrright-col"
          style={{
            paddingLeft: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 300,
          }}
        >
          <DetailedCard card={detailedCard} />
        </div>
      </div>
      <Tooltip
        place="right"
        anchorSelect=".Card-Hand-Bottom"
        delayShow={200}
        variant="info"
        style={{
          minHeight: cardHeight / 2,
          width: cardWidth * 2,
        }}
        render={({ content, activeAnchor }) => <span>{content}</span>}
      />
    </div>
  );
}
export { MadrigalBoard };
