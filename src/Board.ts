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
    cells: Card[]
}

export interface Card {
    name: string
    basePoints: number
    id?: string
}