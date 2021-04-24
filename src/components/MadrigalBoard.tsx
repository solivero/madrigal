import { Ctx } from 'boardgame.io';
import { GameState, Card, Board, Player, CardSlot } from '../models'
import React, { useState } from 'react';
import { range } from 'lodash'
import { props } from 'lodash/fp';

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

const legacyPlayerHandCardStyle: React.CSSProperties = {
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
    <div style={{ ...cardStyle, borderColor: card.color }}>
        <p>{card.name}</p>
        <p>{card.points}</p>
    </div>
)

interface PlayerHandCardProps {
    card: Card
    onSelect: (card: Card) => void
    selected: boolean
    hidden: boolean
}
const PlayerHandCardRender = ({ card, onSelect, selected, hidden }: PlayerHandCardProps) => {
    const style = {
        ...cardStyle,
        borderColor: card.color,
        backgroundColor: selected ? 'white' : cardStyle.backgroundColor
    }
    return (
        <div
            className="Card-Hand"
            style={style}
            onClick={() => !hidden && onSelect(card)}
        >
            {!hidden && [
                <p>{card.name}</p>,
                <p>{card.points}</p>
            ]}
        </div >
    )
}

function PlayerHand(props: { player: Player, hand: Card[], hidden: boolean, onSelect: (card: Card) => void, activeCardId: string | null }): JSX.Element {

    return <div style={{ margin: 'auto', display: 'flex', justifyContent: 'center' }}>
        {props.hand.map(card => (
            <PlayerHandCardRender
                key={card.id}
                card={card}
                hidden={props.hidden}
                onSelect={props.onSelect}
                selected={card.id === props.activeCardId}
            />
        ))}
    </div>
}


const cardSlotStyle: React.CSSProperties = {
    border: '2px solid #555',
    borderRadius: '2px',
    width: '105px',
    height: '140px',
    lineHeight: '50px',
    textAlign: 'center',
}

function CardSlotRender({ cardSlot, onClick }: { cardSlot: CardSlot, onClick: (cardSlot: CardSlot) => void }): JSX.Element {
    const style = {
        ...cardSlotStyle,
        borderColor: cardSlot.color,
        backgroundColor: 'rgb(145,145,145, 0.5)'
    }
    return (
        <td style={style} onClick={() => onClick(cardSlot)}>
            {cardSlot.card && <CardRender card={cardSlot.card} />}
        </td>
    )
}

function PlayerBoard(props: { player: Player, board: Board, onClickSlot: (cardSlot: CardSlot) => void }): JSX.Element {

    const rows = range(props.board.rows)
    const rowSlots = rows.map(row => {
        const startIndex = row * props.board.cols
        const slots = props.board.cardSlots.slice(startIndex, startIndex + props.board.cols)
        return slots.map(cardSlot => <CardSlotRender onClick={props.onClickSlot} cardSlot={cardSlot} />)
    })
    const playerBoard = rowSlots.map(cardSlots => <tr>{cardSlots}</tr>);
    return (
        <table id={`board-${props.player}`} style={{ margin: 'auto' }}>
            <tbody>{playerBoard}</tbody>
        </table>
    )
}

function MadrigalBoard({ G, ctx, moves }: Props): JSX.Element {

    const p0 = G.players.p0
    const p1 = G.players.p1
    const currentPlayer: Player = 'p' + ctx.currentPlayer as Player
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const selectCard = (card: Card) => {
        if (card.id === activeCardId) {
            setActiveCardId(null)
        } else if (card.id) {
            setActiveCardId(card.id)
        }
    }
    const clickCardSlot = (cardSlot: CardSlot) => {
        console.log(cardSlot.index, cardSlot?.card)
        if (activeCardId) {
            console.log('playCard', activeCardId, cardSlot.index)
            try {
                const result = moves.playCard(activeCardId, cardSlot.index)
                console.log("result", result)
            } catch (e) {
                console.log('Error in playCard')
                console.error(e)
            }
            setActiveCardId(null)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            overflow: 'auto',
            width: '100%',
            height: '100%', backgroundImage: `url("background.jpg")`, backgroundSize: 'cover',
        }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div id="left-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h2>Points {p0.points}</h2>
                    <div style={legacyPlayerHandCardStyle}>
                        <p>Deck</p>
                        <p>{G.deck.length}</p>
                    </div>
                    <h2>Points {p1.points}</h2>
                </div>
                <div id="mid-col">
                    <PlayerHand player="p0" hand={p0.hand} hidden={currentPlayer === 'p1'} onSelect={selectCard} activeCardId={activeCardId} />
                    <div style={{ height: 50 }}></div>
                    <PlayerBoard player="p0" board={p0.board} onClickSlot={clickCardSlot} />
                    <div style={{ height: 100 }}></div>
                    <PlayerBoard player="p1" board={p1.board} onClickSlot={clickCardSlot} />
                    <div style={{ height: 10 }}></div>
                    <PlayerHand player="p1" hand={p1.hand} hidden={currentPlayer === 'p0'} onSelect={selectCard} activeCardId={activeCardId} />
                </div>
                <div id="left-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={cardSlotStyle}>Graveyard</div>
                    <div style={cardSlotStyle}>Graveyard</div>
                </div>
            </div>
        </div>
    );
}
export {
    MadrigalBoard
}