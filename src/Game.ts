import { Card, GameState, PlayerState, CardSlot, CellColor } from "./Board";
import './App.css';
import { Ctx, Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core'
import { Merchant, Spy, Fisherman, Priest, Standard, Thief } from './Cards'
import fp from 'lodash/fp'
import _ from 'lodash'

type Player = 'p0' | 'p1'

const getPlayer = (G: GameState, player: Player) => G.players[player]

const getCardOnHand = (G: GameState, player: Player, cardId: string) => {
    return G.players[player].hand.find(card => card.id === cardId)
}


const updatePlayer = (player: Player, updater: (playerState: PlayerState) => Partial<PlayerState>) => (G: GameState) => {
    return fp.update(['players', player], (playerState: PlayerState) => ({
        ...playerState,
        ...updater(playerState)
    }))(G)
}

const addCardToBoard = (player: Player, card: Card, boardCell: number) => (G: GameState) => {
    G.players[player].board.cardSlots[boardCell].card = card
    //return updatePlayer(G, player, ({ board }) => {
    //return { board }
    //})
}

const addCardToHand = (ctx: Ctx, player: Player, card: Card) => {
    const id = `${player}-${ctx.random?.Number().toFixed(4)}`
    const newCard = { ...card, id }
    return updatePlayer(player, playerState => ({
        hand: [...playerState.hand, newCard],
    }))
}

const removeCardFromHand = (player: Player, cardId: string) => {
    return updatePlayer(player, playerState => ({
        hand: playerState.hand.filter(card => card.id !== cardId)
    }))
}

const drawCard = (ctx: Ctx, player: Player) => (G: GameState) => {
    const card = _.head(G.deck)
    if (card) {
        const deck = _.tail(G.deck)
        const gameState = {
            ...G,
            deck,
        }
        return addCardToHand(ctx, player, card)(gameState)
    }
    return G
}

function playCard(G: GameState, ctx: Ctx, cardId: string, boardCell: number) {
    const player = 'p' + ctx.currentPlayer as Player
    console.log(player, cardId, boardCell)
    const card = getCardOnHand(G, player, cardId)
    if (!card) {
        return INVALID_MOVE
    }
    const playerBoard = getPlayer(G, player).board
    if (playerBoard.cardSlots[boardCell].card) {
        console.log("Occupied")
        return INVALID_MOVE
    }
    if (card.color !== 'gold' && card.color !== playerBoard.cardSlots[boardCell].color) {
        console.log("Bad color")
        return INVALID_MOVE
    }
    return fp.flow(
        removeCardFromHand(player, cardId),
        addCardToBoard(player, card, boardCell)
    )(G)
}

function setup(ctx: Ctx): GameState {
    const n_cols = 6
    function makeEmptyCardSlotRow(color: CellColor, row: number): CardSlot[] {
        const rowStartIndex = row * n_cols
        return [
            {
                index: rowStartIndex,
                color: 'neutral',
            },
            ..._.range(1,5).map(index => ({
                index: rowStartIndex + index,
                color,
            })),
            {
                index: rowStartIndex + 5,
                color: 'neutral'
            },
        ]
    }
    
    const rowColors : CellColor[] = ['blue', 'green', 'red']
    const emptyPlayerState = (player: Player) : PlayerState => {
        const orderedRowColors = player === 'p0' ? rowColors : _.reverse(rowColors)
        return {
            board: {
                cardSlots: _.flatMap<CellColor, CardSlot>(orderedRowColors, makeEmptyCardSlotRow),
                cols: n_cols,
                rows: rowColors.length,
            },
            hand: [],
            graveyard: [],
        }
    }
    const gameState : GameState = {
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
            return drawCard(ctx, player)(G)
        },
    },
    moves: {
        playCard,
    },

}

export { Madrigal }