import { Card, CardColor } from '../models'

export const Spy1 = (color: CardColor): Card => ({
  name: 'Spy',
  basePoints: 1,
  points: 1,
  color
})

export const Spy2 = (color: CardColor): Card => ({
  name: 'Spy',
  basePoints: 2,
  points: 2,
  color
})

export const Fisherman = (color: CardColor): Card => ({
  name: 'Fisherman',
  basePoints: 3,
  points: 3,
  color
})

export const Farmer = (color: CardColor): Card => ({
  name: 'Farmer',
  basePoints: 4,
  points: 4,
  color
})

export const Smith = (color: CardColor): Card => ({
  name: 'Smith',
  basePoints: 5,
  points: 5,
  color
})

export const Merchant = (color: CardColor): Card => ({
  name: 'Merchant',
  basePoints: 6,
  points: 6,
  color
})

export const Priest = (color: CardColor): Card => ({
  name: 'Priest',
  basePoints: 7,
  points: 7,
  color
})

export const Warrior = (color: CardColor): Card => ({
  name: 'Warrior',
  basePoints: 8,
  points: 8,
  color
})

export const FieldMarshal = (color: CardColor): Card => ({
  name: 'Field marshal',
  basePoints: 9,
  points: 9,
  color
})

export const Hero = (points: 10 | 11 | 12) => (color: CardColor): Card => ({
  name: 'Hero',
  basePoints: points,
  points,
  color
})

export const Standard = (color: CardColor): Card => ({
  name: 'Standard',
  basePoints: 13,
  points: 13,
  color
})

export const Fog = (color: CardColor): Card => ({
  name: 'Fog',
  basePoints: 0,
  points: 0,
  color
})

export const Jester = (color: CardColor): Card => ({
  name: 'Jester',
  basePoints: 0,
  points: 0,
  color
})
