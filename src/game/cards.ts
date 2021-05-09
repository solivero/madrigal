import { Card, CardColor } from '../models'

const getImageUrl = (color: CardColor, name: string) => `cardimages/${name}-${color}.jpg`

export const Spy1 = (color: CardColor): Card => ({
  name: 'Spy',
  basePoints: 1,
  points: 1,
  imageUrl: getImageUrl(color, 'Spy1'),
  isHero: false,
  color
})

export const Spy2 = (color: CardColor): Card => ({
  name: 'Spy',
  basePoints: 2,
  points: 2,
  imageUrl: getImageUrl(color, 'Spy2'),
  isHero: false,
  color
})

export const Fisherman = (color: CardColor): Card => ({
  name: 'Fisherman',
  basePoints: 3,
  points: 3,
  imageUrl: getImageUrl(color, 'Fisherman'),
  isHero: false,
  color
})

export const Farmer = (color: CardColor): Card => ({
  name: 'Farmer',
  basePoints: 4,
  points: 4,
  imageUrl: getImageUrl(color, 'Farmer'),
  isHero: false,
  color
})

export const Smith = (color: CardColor): Card => ({
  name: 'Smith',
  basePoints: 5,
  points: 5,
  imageUrl: getImageUrl(color, 'Smith'),
  isHero: false,
  color
})

export const Merchant = (color: CardColor): Card => ({
  name: 'Merchant',
  basePoints: 6,
  points: 6,
  imageUrl: getImageUrl(color, 'Merchant'),
  isHero: false,
  color
})

export const Priest = (color: CardColor): Card => ({
  name: 'Priest',
  basePoints: 7,
  points: 7,
  imageUrl: getImageUrl(color, 'Priest'),
  isHero: true,
  color
})

export const Warrior = (color: CardColor): Card => ({
  name: 'Warrior',
  basePoints: 8,
  points: 8,
  imageUrl: getImageUrl(color, 'Warrior'),
  isHero: false,
  color
})

export const FieldMarshal = (color: CardColor): Card => ({
  name: 'Field marshal',
  basePoints: 9,
  points: 9,
  imageUrl: getImageUrl(color, 'FieldMarshal'),
  isHero: false,
  color
})

export const Treasurer = (color: CardColor): Card => ({
  name: 'Treasurer',
  basePoints: 10,
  points: 10,
  imageUrl: getImageUrl(color, 'Treasurer'),
  isHero: true,
  color
})

export const Queen = (color: CardColor): Card => ({
  name: 'Queen',
  basePoints: 11,
  points: 11,
  imageUrl: getImageUrl(color, 'Queen'),
  isHero: true,
  color
})

export const King = (color: CardColor): Card => ({
  name: 'Treasurer',
  basePoints: 12,
  points: 12,
  imageUrl: getImageUrl(color, 'King'),
  isHero: true,
  color
})

export const Standard = (color: CardColor): Card => ({
  name: 'Standard',
  basePoints: 13,
  points: 13,
  imageUrl: getImageUrl(color, 'Standard'),
  isHero: true,
  color
})

export const Fog = (color: CardColor): Card => ({
  name: 'Fog',
  basePoints: 0,
  points: 0,
  imageUrl: getImageUrl(color, 'Fisherman'),
  isHero: true,
  color
})

export const Jester = (color: CardColor): Card => ({
  name: 'Jester',
  basePoints: 0,
  points: 0,
  imageUrl: getImageUrl(color, 'Fisherman'),
  isHero: true,
  color
})
