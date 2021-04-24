import { Card, GameState, PlayerState, CardSlot, CellColor, Player } from '../models'
import { Ctx, Game } from 'boardgame.io';
import { Merchant, Spy, Fisherman, Priest, Standard, Thief } from './cards'
import { addCardToHand, countPlayerPoints, drawCard } from './construct'
import { playCard } from './moves'
import fp from 'lodash/fp'
import _ from 'lodash'

function setup(ctx: Ctx): GameState {
    const n_cols = 6
    function makeEmptyCardSlotRow(color: CellColor, row: number): CardSlot[] {
        const rowStartIndex = row * n_cols
        return [
            {
                index: rowStartIndex,
                color: 'neutral',
            },
            ..._.range(1, 5).map(index => ({
                index: rowStartIndex + index,
                color,
            })),
            {
                index: rowStartIndex + 5,
                color: 'neutral'
            },
        ]
    }

    const rowColors: CellColor[] = ['red', 'blue', 'green']
    const emptyPlayerState = (player: Player): PlayerState => {
        const orderedRowColors = player === 'p0' ? rowColors : _.reverse(rowColors)
        return {
            board: {
                cardSlots: _.flatMap<CellColor, CardSlot>(orderedRowColors, makeEmptyCardSlotRow),
                cols: n_cols,
                rows: rowColors.length,
            },
            hand: [],
            graveyard: [],
            points: 0,
        }
    }
    const gameState: GameState = {
        players: {
            p0: emptyPlayerState('p0'),
            p1: emptyPlayerState('p1'),
        },
        deck: [
            Spy('red'),
            Merchant('red'),
            Fisherman('red'),
        ],
    }
    const p0startingCards: Card[] = [
        Priest('blue'),
        Standard('blue'),
        Thief('blue'),
    ]
    const p1startingCards: Card[] = [
        Spy('green'),
        Merchant('green'),
        Fisherman('green'),
    ]

    const addStartingCard = fp.flow(
        [
            ...p0startingCards.map(card => addCardToHand(ctx, 'p0', card)),
            ...p1startingCards.map(card => addCardToHand(ctx, 'p1', card))
        ]
    )

    return addStartingCard(gameState)
}

const Madrigal: Game<GameState> = {
    setup,
    turn: {
        moveLimit: 1,
        onBegin: (G, ctx) => {
            const player = 'p' + ctx.currentPlayer as Player
            return fp.flow(
                drawCard(ctx, player),
                countPlayerPoints('p0'),
                countPlayerPoints('p1')
            )(G)
        },
    },
    moves: {
        playCard,
    },

}

export { Madrigal }