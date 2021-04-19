import { Card, GameState, PlayerState } from "./Board";
import './App.css';
import { Ctx, Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core'
import fp from 'lodash/fp'
import _ from 'lodash'

type Player = 'p0' | 'p1'

const getPlayer = (G: GameState, player: Player) => G.players[player]

const getCardOnHand = (G: GameState, player: Player, cardId: string) => {
    return G.players[player].hand.find(card => card.id === cardId)
}


const updatePlayer = (G: GameState, player: Player, updater: (playerState: PlayerState) => any): GameState => {
    return fp.update(['players', player], (playerState: PlayerState) => ({
        ...playerState,
        ...updater(playerState)
    }))(G)
}

const addCardToBoard = (player: Player, card: Card, boardCell: number) => (G: GameState) => {
    G.players[player].board.cells[boardCell] = card
    //return updatePlayer(G, player, ({ board }) => {
    //return { board }
    //})
}

const addCardToHand = (ctx: Ctx, player: Player, card: Card) => (G: GameState) => {
    const id = `${player}-${ctx.random?.Number().toFixed(4)}`
    const newCard = { ...card, id }
    return updatePlayer(G, player, playerState => ({
        ...playerState,
        hand: [...playerState.hand, newCard],
    }))
}

const removeCardFromHand = (player: Player, cardId: string) => (G: GameState) => {
    return updatePlayer(G, player, playerState => ({
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


const Madrigal: Game<GameState> = {
    setup(ctx): GameState {
        const emptyPlayerState: PlayerState = {
            board: {
                cells: Array(12).fill(null),
            },
            hand: [],
            graveyard: [],
        }
        const gameState = {
            players: {
                p0: emptyPlayerState,
                p1: emptyPlayerState,
            },
            deck: [
                {
                    name: 'Spy',
                    basePoints: 1,
                },
                {
                    name: 'Merchant',
                    basePoints: 6,
                },
                {
                    name: 'Fisherman',
                    basePoints: 3,
                },
            ],
        }
        const p0startingCards: Card[] = [
            {
                name: 'Die Priesterin',
                basePoints: 7,
            },
            {
                name: 'Standard',
                basePoints: 12,
            },
            {
                name: 'Thief',
                basePoints: 2,
            },
        ]
        const p1startingCards: Card[] = [
            {
                name: 'Spy',
                basePoints: 1,
            },
            {
                name: 'Merchant',
                basePoints: 6,
            },
            {
                name: 'Fisherman',
                basePoints: 3,
            },
        ]

        const addStartingCard = fp.flow(
            [
                ...p0startingCards.map(card => addCardToHand(ctx, 'p0', card)),
                ...p1startingCards.map(card => addCardToHand(ctx, 'p1', card))
            ]
        )

        return addStartingCard(gameState)
    },
    moves: {
        placeCard: (G, ctx, cardId: string, boardCell: number) => {
            const player = 'p' + ctx.currentPlayer as Player
            console.log(player, cardId, boardCell)
            if (getPlayer(G, player).board.cells[boardCell]) {
                console.log("Occupied")
                return INVALID_MOVE
            }
            const card = getCardOnHand(G, player, cardId)
            if (card) {
                return fp.flow(
                    removeCardFromHand(player, cardId),
                    addCardToBoard(player, card, boardCell)
                )(G)
            }
            console.log("Invalid card")
            return INVALID_MOVE
        },
        drawCard: (G, ctx) => {
            const player = 'p' + ctx.currentPlayer as Player
            return drawCard(ctx, player)(G)
        }
    },
}

export { Madrigal }