import fp from 'lodash/fp'
import _ from 'lodash'
import { Card, GameState, PlayerState, Player, CardSlot } from '../models'
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

function countPlayerPoints(player: Player): GameStateProducer {
    const getSlotsWithCard = fp.filter((cardSlot: CardSlot) => Boolean(cardSlot?.card))
    const getCards = fp.map((cardSlot: CardSlot) => cardSlot.card as Card)
    const sumPoints = fp.sumBy((card: Card) => card.points)
    const tallyBoardPoints = fp.flow(
        getSlotsWithCard,
        getCards,
        sumPoints
    )
    return updatePlayer(player, (playerState: PlayerState) => ({
        points: tallyBoardPoints(playerState.board.cardSlots)
    }))
}

function addCardToBoard(player: Player, card: Card, boardCell: number) {

    // Ridicoulus verbose to update deep structure while avoiding immer error
    return updatePlayer(player, ({ board }) => {
        const cardSlots = board.cardSlots.map(cardSlot => {
            if (cardSlot.index === boardCell) {
                return {
                    ...cardSlot,
                    card,
                }
            }
            return cardSlot
        })
        return {
            board: {
                ...board,
                cardSlots,
            }
        }
    })
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
    countPlayerPoints,
}