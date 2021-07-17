import * as React from "react";
import { Ctx } from "boardgame.io";
import { GameState, Card, Board, Player, CardSlot } from "../models";
import { range } from "lodash";

interface Props {
  moves: any;
  events: any;
  isActive: boolean;
  G: GameState;
  ctx: Ctx;
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

const CardComp = ({ card }: { card: Card }) => (
  <div
    style={{
      ...cardStyle,
      borderColor: card.color,
      backgroundImage: `url(${card.imageUrl})`,
    }}
  >
    <span>{card.name}</span>
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
      className={player === "p0" ? "Card-Hand-Top" : "Card-Hand-Bottom"}
      style={style}
      onClick={() => !hidden && onSelect(card)}
    >
      {!hidden && (
        <>
          <span>{card.name}</span>
          <span>{card.points}</span>
        </>
      )}
    </div>
  );
};

function PlayerHand(props: {
  player: Player;
  hand: Card[];
  hidden: boolean;
  onSelect: (card: Card) => void;
  activeCardId: string | null;
}) {
  return (
    <div style={{ margin: "auto", display: "flex", justifyContent: "center" }}>
      {props.hand.map((card) => (
        <PlayerHandCardComp
          key={card.id}
          card={card}
          hidden={props.hidden}
          onSelect={props.onSelect}
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
}: {
  cardSlot: CardSlot;
  onClick: (cardSlot: CardSlot) => void;
}) {
  const style = {
    ...cardSlotStyle,
    borderColor: cardSlot.color,
    backgroundColor: "rgb(145,145,145, 0.5)",
  };
  return (
    <td style={style} onClick={() => onClick(cardSlot)}>
      {cardSlot.card && <CardComp card={cardSlot.card} />}
    </td>
  );
}

function PlayerBoard(props: {
  player: Player;
  board: Board;
  onClickSlot: (cardSlot: CardSlot) => void;
}) {
  const rows = range(props.board.rows);
  const rowSlots = rows.map((row) => {
    const startIndex = row * props.board.cols;
    const slots = props.board.cardSlots.slice(
      startIndex,
      startIndex + props.board.cols
    );
    return slots.map((cardSlot) => (
      <CardSlotComp
        key={cardSlot.index}
        onClick={props.onClickSlot}
        cardSlot={cardSlot}
      />
    ));
  });
  const playerBoard = rowSlots.map((cardSlots, i) => (
    <tr key={i}>{cardSlots}</tr>
  ));
  return (
    <table id={`board-${props.player}`} style={{ margin: "auto" }}>
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

function MadrigalBoard({ G, ctx, moves }: Props) {
  const p0 = G.players.p0;
  const p1 = G.players.p1;
  const currentPlayer: Player = ("p" + ctx.currentPlayer) as Player;
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const selectCard = (card: Card) => {
    if (card.id === activeCardId) {
      setActiveCardId(null);
    } else if (card.id) {
      setActiveCardId(card.id);
    }
  };
  const clickCardSlot = (cardSlot: CardSlot) => {
    console.log(cardSlot.index, cardSlot?.card);
    if (activeCardId) {
      console.log("playCard", activeCardId, cardSlot.index);
      try {
        const result = moves.playCard(activeCardId, cardSlot.index);
        console.log("result", result);
      } catch (e) {
        console.log("Error in playCard");
        console.error(e);
      }
      setActiveCardId(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        overflow: "auto",
        width: "100%",
        height: "100%",
        backgroundImage: 'url("background.jpg")',
        backgroundSize: "cover",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          id="left-col"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2>Games {p0.games}</h2>
            <h2>Points {p0.points}</h2>
            {p0.passed && <h2>Passed</h2>}
          </div>
          <Deck deck={G.deck} />
          <div>
            {p1.passed && <h2>Passed</h2>}
            <h2>Points {p1.points}</h2>
            <h2>Games {p1.games}</h2>
          </div>
        </div>
        <div id="mid-col">
          <PlayerHand
            player="p0"
            hand={p0.hand}
            hidden={currentPlayer === "p1"}
            onSelect={selectCard}
            activeCardId={activeCardId}
          />
          <div style={{ height: 10 }}></div>
          <PlayerBoard
            player="p0"
            board={p0.board}
            onClickSlot={clickCardSlot}
          />
          <div style={{ height: 40 }}>
            {ctx.gameover && (
              <h1 style={{ textAlign: "center" }}>{ctx.gameover}</h1>
            )}
          </div>
          <PlayerBoard
            player="p1"
            board={p1.board}
            onClickSlot={clickCardSlot}
          />
          <div style={{ height: 10 }}></div>
          <PlayerHand
            player="p1"
            hand={p1.hand}
            hidden={currentPlayer === "p0"}
            onSelect={selectCard}
            activeCardId={activeCardId}
          />
        </div>
        <div
          id="left-col"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Graveyard graveyard={p0.graveyard} />
          {/* <ScoreBoard p0={p0} p1={p1} /> */}
          <button
            onClick={() => moves.pass()}
            style={{ height: 60, borderRadius: 5, fontSize: 15 }}
          >
            Pass
          </button>
          <Graveyard graveyard={p1.graveyard} />
        </div>
      </div>
    </div>
  );
}
export { MadrigalBoard };
