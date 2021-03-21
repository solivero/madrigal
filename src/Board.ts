export interface PlayerState {
    board: Board
    hand: Card[]
    graveyard: Card[]
}

export interface GameState {
    players: {
        p1: PlayerState
        p2: PlayerState
    }
    deck: Card[]
}

export interface Board {
    cells: Number[]
}

export interface Card {
    name: string
    basePoints: number
}