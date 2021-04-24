export type CardColor = 'green' | 'blue' | 'red' | 'gold'
export type CellColor = CardColor | 'neutral'
export type Player = 'p0' | 'p1'

export interface CardSlot {
    card?: Card
    //row: number
    //col: number
    index: number
    color: CellColor
}

export interface PlayerState {
    board: Board
    hand: Card[]
    graveyard: Card[]
}

export interface GameState {
    players: {
        p0: PlayerState
        p1: PlayerState
    }
    deck: Card[]
}

export interface Board {
    cardSlots: CardSlot[]
    rows: number
    cols: number
}

export interface Card {
    name: string
    basePoints: number
    color: CardColor
    id?: string
}