import fp from 'lodash/fp'
import _ from 'lodash'
import { Card, GameState, Board, PlayerState, Player, CardSlot, CardColor } from '../models'
import { Spy1, Spy2, Fisherman, FieldMarshal, Farmer, Fog, Jester, Merchant, Warrior, Priest, Smith, Standard, Treasurer, Queen, King } from './cards'

import { Ctx } from 'boardgame.io'

type GameStateProducer = (G: GameState) => GameState

function makeShuffledDeck (ctx: Ctx): Card[] {
  const colors: CardColor[] = ['green', 'blue', 'red', 'gold']
  const cardFuncs: ((color: CardColor) => Card)[] = [Spy1, Spy2, FieldMarshal, Fisherman, Farmer, Merchant, Warrior, Priest, Smith, Standard, Treasurer, Queen, King, Fog, Jester]
  const cards = _.flatMap(cardFuncs, cardFunc => _.map(colors, cardFunc))
  const deck = ctx.random?.Shuffle(cards)
  if (deck) {
    return deck
  }
  return []
}

function getPlayer (G: GameState, player: Player) {
  return G.players[player]
}

function getCardOnHand (G: GameState, player: Player, cardId: string) {
  return G.players[player].hand.find(card => card.id === cardId)
}

function updatePlayer (player: Player, updater: (playerState: PlayerState) => Partial<PlayerState>): GameStateProducer {
  return fp.update(['players', player], (playerState: PlayerState) => ({
    ...playerState,
    ...updater(playerState)
  }))
}
function updatePlayerBoard (player: Player, updater: (board: Board) => Partial<Board>): GameStateProducer {
  return updatePlayer(player, ({ board }) => ({
    board: {
      ...board,
      ...updater(_.cloneDeep(board))
    }
  }))
}
function getColumn (board: Board, colIdx: number): CardSlot[] {
  return _.times(board.rows).map(rowIdx => board.cardSlots[(board.cols * rowIdx) + colIdx])
}

function getRow (board: Board, rowIdx: number): CardSlot[] {
  const startIdx = rowIdx * board.cols
  const endIdx = startIdx + board.cols
  return board.cardSlots.slice(startIdx, endIdx)
}

function addColumnBuffs (player: Player): GameStateProducer {
  return updatePlayerBoard(player, board => {
    const buffedBoard = board.cardSlots.map(slot => {
      if (!slot?.card) {
        return slot
      }
      if (slot.card.isHero) {
        return slot
      }
      const { card } = slot
      const smithBuff = getSmithBuff(board, slot)
      const columnBuff = getColumnBuff(board, slot)
      const points = _.sum([card.basePoints, smithBuff, columnBuff])
      const buffedCard = {
        ...card,
        points
      }
      return {
        ...slot,
        card: buffedCard
      }
    })
    return {
      cardSlots: buffedBoard
    }
  })
}

function getColumnBuff (board: Board, slot: CardSlot): number {
  const card = slot.card as Card
  const colIdx = slot.index % board.cols
  const col = getColumn(board, colIdx)
  const sameCards = col.filter(cardSlot => cardSlot?.card && cardSlot.card.basePoints === card.basePoints)
  const points = card.basePoints * (sameCards.length - 1)
  return points
}

function getSmithBuff (board: Board, slot: CardSlot): number {
  const rowIdx = Math.floor(slot.index / board.cols)
  const row = getRow(board, rowIdx)
  const smith = row.find(cardSlot => cardSlot?.card && cardSlot.card.basePoints === 5)
  if (smith) {
    return 1
  }
  return 0
}

function countPlayerPoints (player: Player): GameStateProducer {
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

function addCardToBoard (player: Player, card: Card, boardCell: number) {
  // Ridicoulus verbose to update deep structure while avoiding immer error
  return updatePlayer(player, ({ board }) => {
    const cardSlots = board.cardSlots.map(cardSlot => {
      if (cardSlot.index === boardCell) {
        return {
          ...cardSlot,
          card
        }
      }
      return cardSlot
    })
    return {
      board: {
        ...board,
        cardSlots
      }
    }
  })
}

function addCardToHand (ctx: Ctx, player: Player, card: Card): GameStateProducer {
  const id = `${player}-${ctx.random?.Number().toFixed(4)}`
  const newCard = { ...card, id }
  return updatePlayer(player, playerState => ({
    hand: [...playerState.hand, newCard]
  }))
}

function removeCardFromHand (player: Player, cardId: string): GameStateProducer {
  return updatePlayer(player, playerState => ({
    hand: playerState.hand.filter(card => card.id !== cardId)
  }))
}

function drawCard (ctx: Ctx, player: Player): GameStateProducer {
  return (G: GameState) => {
    const card = _.head(G.deck)
    if (card) {
      const deck = _.tail(G.deck)
      const gameState = {
        ...G,
        deck
      }
      return addCardToHand(ctx, player, card)(gameState)
    }
    return G
  }
}

function setPlayerPassed (player: Player, passed: boolean): GameStateProducer {
  return updatePlayer(player, () => ({
    passed
  }))
}

function incrementGame (player: Player): GameStateProducer {
  return updatePlayer(player, playerState => ({
    games: playerState.games + 1
  }))
}

function boardToGraveyard (player: Player): GameStateProducer {
  return updatePlayer(player, playerState => {
    const boardCards = playerState.board.cardSlots
      .filter(slot => slot.card)
      .map(slot => slot.card as Card)
    const emptyCardSlots = playerState.board.cardSlots.map(fp.omit('card'))
    return {
      graveyard: playerState.graveyard.concat(boardCards),
      board: {
        ...playerState.board,
        cardSlots: emptyCardSlots
      }
    }
  })
}

export {
  drawCard,
  removeCardFromHand,
  addCardToBoard,
  addCardToHand,
  getPlayer,
  getCardOnHand,
  countPlayerPoints,
  makeShuffledDeck,
  setPlayerPassed,
  incrementGame,
  boardToGraveyard,
  addColumnBuffs
}
