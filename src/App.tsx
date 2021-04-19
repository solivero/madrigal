import { Ctx } from 'boardgame.io';
import { Client } from 'boardgame.io/react';
import { Madrigal } from './Game';
import { GameState, Card, Board } from './Board'
import React from 'react';
import { range, reverse } from 'lodash'

interface Props {
  moves: any;
  events: any;
  isActive: boolean;
  G: GameState;
  ctx: Ctx;
}


const cardStyle: React.CSSProperties = {
  border: '2px solid #555',
  width: '90px',
  height: '135px',
  lineHeight: '50px',
  textAlign: 'center',
  margin: 5,
}

const CardRender = ({ card }: { card: Card }) => (
  <div style={cardStyle}>{card.name}</div>
)

function PlayerHand(props: { player: 'p0' | 'p1', hand: Card[] }): JSX.Element {
  return <div style={{ margin: 'auto', display: 'flex', justifyContent: 'center' }}>
    {props.hand.map(card => <CardRender card={card} />)}
  </div>
}


const cardSlotStyle: React.CSSProperties = {
  border: '2px solid #555',
  width: '100px',
  height: '150px',
  lineHeight: '50px',
  textAlign: 'center',
}

function CardSlot({ color, card }: { color: string, card: Card | null }): JSX.Element {
  const style = {
    ...cardSlotStyle,
    borderColor: color,
  }
  return (
    <td style={style}>
     {card && <CardRender card={card} />}
    </td>
  )
}

function PlayerBoard(props: { player: 'p0' | 'p1', board: Board }): JSX.Element {

  const rowColors = ['red', 'green', 'blue']
  const orderedRowColors = props.player === 'p0' ? rowColors : reverse(rowColors)
  const rowSlots = orderedRowColors.map((color, row) => {
    return range(4).map(col => <CardSlot color={color} card={props.board.cells[row * 3 + col]} />)
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
    <div>
      <PlayerHand player="p0" hand={p0.hand} />
      <div style={{ height: 50 }}></div>
      <PlayerBoard player="p0" board={p0.board} />
      <div style={{ height: 100 }}></div>
      <PlayerBoard player="p1" board={p1.board} />
      <div style={{ height: 50 }}></div>
      <PlayerHand player="p1" hand={p1.hand} />
    </div>
  );
}
const App = Client({
  game: Madrigal,
  numPlayers: 2,
  debug: true,
  board: MadrigalBoard
});

export default App;
