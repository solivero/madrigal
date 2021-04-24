import fp from 'lodash/fp'
import _ from 'lodash'
import { Card, GameState, PlayerState, Player } from '../models'
import { Ctx } from 'boardgame.io';

type GameStateProducer = (G: GameState) => GameState

function getPlayer(G: GameState, player: Player) {
    return G.players[player]
}

function getCardOnHand(G: GameState, player: Player, cardId: string) {
    return G.players[player].hand.find(card => card.id === cardId)
}


function updatePlayer(player: Player, updater: (playerState: PlayerState) => Partial<PlayerState>): GameStateProducer {
    return fp.update(['players', player], (playerState: PlayerState) => ({
        ...playerState,
        ...updater(playerState)
    }))
}

function addCardToBoard(player: Player, card: Card, boardCell: number) {
    return (G: GameState) => {
        G.players[player].board.cardSlots[boardCell].card = card //ImmerJS magic makes mutating work when it shouldn't
        //return updatePlayer(G, player, ({ board }) => {
        //return { board }
        //})
    }
}

function addCardToHand(ctx: Ctx, player: Player, card: Card): GameStateProducer {
    const id = `${player}-${ctx.random?.Number().toFixed(4)}`
    const newCard = { ...card, id }
    return updatePlayer(player, playerState => ({
        hand: [...playerState.hand, newCard],
    }))
}

function removeCardFromHand(player: Player, cardId: string): GameStateProducer {
    return updatePlayer(player, playerState => ({
        hand: playerState.hand.filter(card => card.id !== cardId)
    }))
}

function drawCard(ctx: Ctx, player: Player): GameStateProducer {
    return (G: GameState) => {
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
}

export {
    drawCard,
    removeCardFromHand,
    addCardToBoard,
    addCardToHand,
    getPlayer,
    getCardOnHand,
}