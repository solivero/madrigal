import { Ctx, State } from 'boardgame.io';
import { Client } from 'boardgame.io/react';
import { Madrigal } from './Game';
import { GameState } from './Board'
import React from 'react';

interface IProps {
  moves: any;
  events: any;
  isActive: boolean;
  G: GameState;
  ctx: Ctx;
}

class MadrigalBoard extends React.Component {
  onClick(id: number) {
    if (this.isActive(id)) {
      // this.props.moves.clickCell(id);
      // this.props.events.endTurn();
    }
  }
  isActive(id: number) {
    // return this.props.isActive
    return true
  }

  render() {
    const cellStyle: React.CSSProperties = {
      border: '1px solid #555',
      width: '50px',
      height: '50px',
      lineHeight: '50px',
      textAlign: 'center',
    };

    let tbody: JSX.Element[] = [];
    for (let i = 0; i < 3; i++) {
      let cells: JSX.Element[] = [];
      for (let j = 0; j < 3; j++) {
        const id = 3 * i + j;
        cells.push(
          <td style={cellStyle} key={id} onClick={() => this.onClick(id)}>
            {this.props.G.players.p1.board.cells[id]}
          </td>
        );
      }
      tbody.push(<tr key={i}>{cells}</tr>);
    }

    let winner: JSX.Element | undefined = undefined;
    if (this.props.ctx.gameover) {
      winner =
        this.props.ctx.gameover.winner !== undefined ? (
          <div id="winner">Winner: {this.props.ctx.gameover.winner}</div>
        ) : (
            <div id="winner">Draw!</div>
          );
    }
    return (
      <div>
        <table id="board">
          <tbody>{tbody}</tbody>
        </table>
        {winner}
      </div>
    );
  }
}
const App = Client({ game: Madrigal, board: MadrigalBoard });

export default App;
