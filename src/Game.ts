import { GameState, PlayerState } from "./Board";
import './App.css';
import { Game } from 'boardgame.io';

const Madrigal: Game<GameState> = {
    setup(ctx): GameState {
        const emptyPlayerState: PlayerState = {
            board: {
                cells: [],
            },
            hand: [],
            graveyard: [],
        }
        return {
            players: {
                p1: emptyPlayerState,
                p2: emptyPlayerState,
            },
            deck: [],
        }
    },
    moves: {
        placeCard: (G, ctx, id) => {
        }
    },
}

export { Madrigal }