
import { INVALID_MOVE } from 'boardgame.io/core'
import fp from 'lodash/fp'
import { Ctx } from 'boardgame.io';
import { GameState, Player } from '../models'
import { getPlayer, getCardOnHand, addCardToBoard, removeCardFromHand } from './construct'

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

function pass(G: GameState, ctx: Ctx): GameState {
    return G
}

export {
    playCard,
    pass
}