import { Card, CardColor } from '../models'

export const Priest = (color: CardColor): Card => ({
    name: 'Spy',
    basePoints: 1,
    color,
})

export const Merchant = (color: CardColor): Card => ({
    name: 'Merchant',
    basePoints: 6,
    color,
})

export const Fisherman = (color: CardColor): Card => ({
    name: 'Fisherman',
    basePoints: 3,
    color,
})
export const Spy = (color: CardColor): Card => ({
    name: 'Spy',
    basePoints: 2,
    color,
})
export const Thief = (color: CardColor): Card => ({
    name: 'Thief',
    basePoints: 1,
    color,
})
export const Standard = (color: CardColor): Card => ({
    name: 'Standard',
    basePoints: 12,
    color,
})