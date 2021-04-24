import { Ctx } from 'boardgame.io';
import { GameState, Card, Board, Player } from '../models'
import React, { useState } from 'react';
import { range } from 'lodash'

interface Props {
  moves: any;
  events: any;
  isActive: boolean;
  G: GameState;
  ctx: Ctx;
}

const cardStyle: React.CSSProperties = {
  border: '2px solid #555',
  borderRadius: '5px',
  width: '90px',
  height: '135px',
  lineHeight: '50px',
  textAlign: 'center',
  margin: 5,
}

const playerHandCardStyle: React.CSSProperties = {
  border: '2px solid #555',
  borderRadius: '5px',
  width: '90px',
  height: '135px',
  lineHeight: '50px',
  textAlign: 'center',
  backgroundColor: 'lightgray',
  margin: 20,
}




const CardRender = ({ card }: { card: Card }) => (
  <button style={{ ...cardStyle, ...{ transform: 'rotate(20deg)' } }}>{card.name}</button>
)

const PlayerHandCardRender = ({ index, playerHandCardCount, card }: { index: number, playerHandCardCount: number, card: Card }) => {

  return (
    <button
      className="Card-Hand"
      onClick={() => {

      }}
    >
      {card.name}</button>
  )
}

function PlayerHand(props: { player: Player, hand: Card[] }): JSX.Element {
  const playerHandCardCount = props.hand.length;

  const [activeCardId, setActiveCardId] = useState(null);

  return <div style={{ margin: 'auto', display: 'flex', justifyContent: 'center' }}>
    {props.hand.map((card, index) => <PlayerHandCardRender index={index} playerHandCardCount={playerHandCardCount} card={card} />)}
  </div>
}


const cardSlotStyle: React.CSSProperties = {
  border: '2px solid #555',
  borderRadius: '2px',
  width: '75px',
  height: '110px',
  lineHeight: '50px',
  textAlign: 'center',
}

function CardSlot({ color, card }: { color: string, card?: Card }): JSX.Element {
  const style = {
    ...cardSlotStyle,
    borderColor: color,
    backgroundColor: 'rgb(145,145,145, 0.5)'
  }
  return (
    <td style={style}>
      {card && <CardRender card={card} />}
    </td>
  )
}

function PlayerBoard(props: { player: Player, board: Board }): JSX.Element {

  const rows = range(props.board.rows)
  //const orderedRowColors = props.player === 'p0' ? rowColors : reverse(rowColors)
  const rowSlots = rows.map(row => {
    const startIndex = row * props.board.cols
    const slots = props.board.cardSlots.slice(startIndex, startIndex + props.board.cols)
    return slots.map(cardSlot => <CardSlot color={cardSlot.color} card={cardSlot.card} />)
  })
  const playerBoard = rowSlots.map(cardSlots => <tr>{cardSlots}</tr>);
  return (
    <table id={`board-${props.player}`} style={{ margin: 'auto' }}>
      <tbody>{playerBoard}</tbody>
    </table>
  )
}

function MadrigalBoard({ G }: Props): JSX.Element {

  const p0 = G.players.p0
  const p1 = G.players.p1
  return (
    <div style={{
      position: 'fixed',
      overflow: 'auto',
      width: '100%',
      height: '100%', backgroundImage: `url("background.jpg")`, backgroundSize: 'cover',
    }}>
      <PlayerHand player="p0" hand={p0.hand} />
      <div style={{ height: 50 }}></div>
      <PlayerBoard player="p0" board={p0.board} />
      <div style={{ height: 50 }}></div>
      <PlayerBoard player="p1" board={p1.board} />
      <div style={{ height: 10 }}></div>
      <PlayerHand player="p1" hand={p1.hand} />
    </div>
  );
}
export {
    MadrigalBoard
}