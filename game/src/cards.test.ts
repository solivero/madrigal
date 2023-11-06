import { Ctx, Game } from "boardgame.io";
import { Client } from "boardgame.io/client";
import _ from "lodash";
import {
  cardDefinitions,
  getCardDef,
  makeCard,
  makeCardConstructor,
} from "./cards";
import {
  addCardToBoard,
  addCardToHand,
  boardToGraveyard,
  getCardFromHand,
  getPlayerState,
  getRow,
} from "./construct";
import { Madrigal, nCols } from "./game";
import { Card, GameState } from "./models";

function makeScenario(
  setupFn: (initState: GameState, ctx: Ctx) => GameState
): Game<GameState, Ctx, any> {
  return {
    ...Madrigal,
    setup: (ctx: Ctx) => {
      const initState = Madrigal.setup?.(ctx);
      if (!initState) {
        throw Error("No init state");
      }
      return setupFn(initState, ctx);
    },
  };
}

it("Smith buffs cards on row", () => {
  const scenario = makeScenario((initState) => {
    const warrior = makeCard("Warrior", "green");
    const addWarrior = addCardToBoard("0", warrior, 1);
    const smith = makeCard("Smith", "green");
    const addSmith = addCardToBoard("0", smith, 2);
    const hero = makeCard("Treasurer", "green");
    const addTreasurer = addCardToBoard("0", hero, 3);
    const setupState = _.flow(addWarrior, addSmith, addTreasurer);
    return setupState(initState);
  });
  const client = Client({
    game: scenario,
  });

  // get the latest game state
  const state = client.getState();
  if (!state) {
    throw Error("No state");
  }
  const { cardSlots } = state.G.players[0].board;

  const warrior = cardSlots[1].card;
  // Warrior gets buffed +1
  expect(warrior?.points).toBe(9);
  const smith = cardSlots[2].card;
  // Smith doesn not get buff from self
  expect(smith?.points).toBe(5);
  const treasurer = cardSlots[3].card;
  // Buff applies to heroes
  expect(treasurer?.points).toBe(11);
});

it("Fisherman draws card", () => {
  const scenario = makeScenario((initState, ctx) => {
    const fisherman = makeCard("Fisherman", "green");
    const addFishermanToHand = addCardToHand("0", fisherman);
    return addFishermanToHand(initState);
  });
  const client = Client({
    game: scenario,
  });
  const prePlayHand = client.getState()?.G.players[0].hand;
  const fisherman = _.last(prePlayHand);
  expect(fisherman?.name).toBe("Fisherman");
  client.moves.playCardFromHand(fisherman?.id, 1, "0");
  const postPlayHand = client.getState()?.G.players[0].hand;
  expect(postPlayHand?.length).toBe(prePlayHand?.length);
});

it("Playing card removes it from hand", () => {
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "green");
    const addToHand = addCardToHand("0", warrior);
    return addToHand(initState);
  });
  const client = Client({
    game: scenario,
  });
  const prePlayHand = client.getState()?.G.players[0].hand;
  const warrior = _.last(prePlayHand);
  expect(warrior?.name == "Warrior");
  client.moves.playCardFromHand(warrior?.id, 1, "0");
  const postPlayHand = client.getState()?.G.players[0].hand;
  expect(postPlayHand?.length).toBe((prePlayHand?.length || 0) - 1);
});

it("Moving board to graveyard resets cards", () => {
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "green");
    const buffedWarrior = { ...warrior, points: 666 };
    const addWarrior = addCardToBoard("0", buffedWarrior, 0);
    const moveToGraveyard = boardToGraveyard("0");
    return _.flow(addWarrior, moveToGraveyard)(initState);
  });
  const client = Client({
    game: scenario,
  });
  const playerState = client.getState()?.G.players[0];
  expect(playerState?.board.cardSlots[0].card).toBeFalsy();
  expect(playerState?.graveyard[0].points).toBe(8);
});

it("Column multiplies points", () => {
  const topIdx = 1;
  const midIdx = 1 + nCols;
  const bottomIdx = 1 + nCols * 2;
  const scenario = makeScenario((initState, ctx) => {
    const greenWarrior = makeCard("Warrior", "green");
    const addGreenWarrior = addCardToBoard("0", greenWarrior, topIdx);
    const blueWarrior = makeCard("Warrior", "blue");
    const addBlueWarrior = addCardToBoard("0", blueWarrior, midIdx);
    const redWarrior = makeCard("Warrior", "red");
    const addRedWarrior = addCardToBoard("0", redWarrior, bottomIdx);
    const addWarriors = _.flow(addGreenWarrior, addBlueWarrior, addRedWarrior);
    return addWarriors(initState);
  });
  const client = Client({
    game: scenario,
  });

  // get the latest game state
  const state = client.getState();
  if (!state) {
    throw Error("No state");
  }
  const { cardSlots } = state.G.players[0].board;
  const greenWarrior = cardSlots[topIdx].card;
  expect(greenWarrior?.points).toBe(3 * 8);
  const blueWarrior = cardSlots[midIdx].card;
  expect(blueWarrior?.points).toBe(3 * 8);
  const redWarrior = cardSlots[bottomIdx].card;
  expect(redWarrior?.points).toBe(3 * 8);
});

it("Hero does not get effects", () => {
  const scenario = makeScenario((initState, ctx) => {
    const greenTreasurer = makeCard("Treasurer", "green");
    const addGreenTreasurer = addCardToBoard("0", greenTreasurer, 1);
    const blueTreasurer = makeCard("Treasurer", "blue");
    const addBlueTreasurer = addCardToBoard("0", blueTreasurer, 1 + nCols);
    const addCards = _.flow(addGreenTreasurer, addBlueTreasurer);
    return addCards(initState);
  });
  const client = Client({
    game: scenario,
  });

  // get the latest game state
  const state = client.getState();
  if (!state) {
    throw Error("No state");
  }
  const { cardSlots } = state.G.players[0].board;
  const greenTreasurer = cardSlots[1].card;
  // Should not get column buff
  expect(greenTreasurer?.points).toBe(10);
  const blueTreasurer = cardSlots[1 + nCols].card;
  expect(blueTreasurer?.points).toBe(10);
});
it("Flag doubles points for row when placed in effect slot", () => {
  const topIdx = 1;
  const midIdx = 1 + nCols;
  const bottomIdx = 1 + nCols * 2;
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "green");
    const addGreenWarrior = addCardToBoard("0", warrior, 1);

    const smith = makeCard("Smith", "green");
    const addGreenSmith = addCardToBoard("0", smith, 2);

    const priest = makeCard("Priest", "green");
    const addGreenPriest = addCardToBoard("0", priest, 3);

    const treasurer = makeCard("Treasurer", "green");
    const addGreenTreasurer = addCardToBoard("0", treasurer, 4);

    // Second row with flag

    const flag = makeCard("Standard", "blue");
    const addFlag = addCardToBoard("0", flag, nCols);

    const blueWarrior = makeCard("Warrior", "blue");
    const addBlueWarrior = addCardToBoard("0", blueWarrior, nCols + 1);

    const blueSmith = makeCard("Smith", "green");
    const addBlueSmith = addCardToBoard("0", blueSmith, nCols + 2);

    const bluePriest = makeCard("Priest", "green");
    const addBluePriest = addCardToBoard("0", bluePriest, nCols + 3);

    const blueTreasurer = makeCard("Treasurer", "green");
    const addBlueTreasurer = addCardToBoard("0", blueTreasurer, nCols + 4);

    const addCards = _.flow(
      addGreenWarrior,
      addGreenSmith,
      addGreenPriest,
      addGreenTreasurer,
      addFlag,
      addBlueWarrior,
      addBlueSmith,
      addBluePriest,
      addBlueTreasurer
    );
    return addCards(initState);
  });
  const client = Client({
    game: scenario,
  });

  // get the latest game state
  const state = client.getState();
  if (!state) {
    throw Error("No state");
  }
  const { board } = state.G.players[0];
  const greenRow = getRow(board, 0);
  const blueRow = getRow(board, 1);

  const greenWarrior = greenRow[1].card;
  const blueWarrior = blueRow[1].card;
  expect(blueWarrior?.points).toBe((greenWarrior?.points || 0) * 2);

  const greenSmith = greenRow[2].card;
  const blueSmith = blueRow[2].card;
  expect(blueSmith?.points).toBe((greenSmith?.points || 0) * 2);

  // Priest should not be affected by flag
  const greenPriest = greenRow[3].card;
  const bluePriest = blueRow[3].card;
  expect(bluePriest?.points).toBe(greenPriest?.points);

  // Hero should not be affected by flag
  const greenTreasurer = greenRow[4].card;
  const blueTreasurer = blueRow[4].card;
  expect(blueTreasurer?.points).toBe(greenTreasurer?.points);
});

it("Farmer buffs heroes and priests", () => {
  const warriorIdx = 1;
  const fieldMarshalIdx = 4;
  const priestIdx = nCols + 3;
  const treasurerIdx = nCols + 5;
  const farmerIdx = nCols * 2 + 2;
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "green");
    const addWarrior = addCardToBoard("0", warrior, warriorIdx);

    const fieldMarshal = makeCard("Field marshal", "green");
    const addSmith = addCardToBoard("0", fieldMarshal, fieldMarshalIdx);

    const priest = makeCard("Priest", "green");
    const addPriest = addCardToBoard("0", priest, priestIdx);

    const treasurer = makeCard("Treasurer", "green");
    const addTreasurer = addCardToBoard("0", treasurer, treasurerIdx);

    const farmer = makeCard("Farmer", "green");
    const addFarmer = addCardToBoard("0", farmer, farmerIdx);

    const addCards = _.flow(
      addWarrior,
      addSmith,
      addPriest,
      addTreasurer,
      addFarmer
    );
    return addCards(initState);
  });
  const client = Client({
    game: scenario,
  });

  // get the latest game state
  const state = client.getState();
  if (!state) {
    throw Error("No state");
  }
  const { cardSlots } = state.G.players[0].board;

  // No buff
  const warrior = cardSlots[warriorIdx].card;
  expect(warrior?.points).toBe(8);

  // No buff
  const fieldMarshal = cardSlots[fieldMarshalIdx].card;
  expect(fieldMarshal?.points).toBe(9);

  // Buff
  const priest = cardSlots[priestIdx].card;
  expect(priest?.points).toBe(8);

  // Buff
  const treasurer = cardSlots[treasurerIdx].card;
  expect(treasurer?.points).toBe(11);
});

it("Farmer buffs multiplies", () => {
  const warriorIdx = 1;
  const fieldMarshalIdx = 4;
  const priestIdx = nCols + 3;
  const treasurerIdx = nCols + 5;
  const blueFarmerIdx = nCols + 4;
  const greenFarmerIdx = nCols * 2 + 2;
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "green");
    const addWarrior = addCardToBoard("0", warrior, warriorIdx);

    const fieldMarshal = makeCard("Field marshal", "green");
    const addSmith = addCardToBoard("0", fieldMarshal, fieldMarshalIdx);

    const priest = makeCard("Priest", "green");
    const addPriest = addCardToBoard("0", priest, priestIdx);

    const treasurer = makeCard("Treasurer", "green");
    const addTreasurer = addCardToBoard("0", treasurer, treasurerIdx);

    const greenFarmer = makeCard("Farmer", "green");
    const addGreenFarmer = addCardToBoard("0", greenFarmer, greenFarmerIdx);

    const blueFarmer = makeCard("Farmer", "blue");
    const addBlueFarmer = addCardToBoard("0", blueFarmer, blueFarmerIdx);

    const addCards = _.flow(
      addWarrior,
      addSmith,
      addPriest,
      addTreasurer,
      addGreenFarmer,
      addBlueFarmer
    );
    return addCards(initState);
  });
  const client = Client({
    game: scenario,
  });

  // get the latest game state
  const state = client.getState();
  if (!state) {
    throw Error("No state");
  }
  const { cardSlots } = state.G.players[0].board;

  // No buff
  const warrior = cardSlots[warriorIdx].card;
  expect(warrior?.points).toBe(8);

  // No buff
  const fieldMarshal = cardSlots[fieldMarshalIdx].card;
  expect(fieldMarshal?.points).toBe(9);

  // Buff, 2 per farmer
  const priest = cardSlots[priestIdx].card;
  expect(priest?.points).toBe(7 + 4);

  // Buff, 2 per farmer
  const treasurer = cardSlots[treasurerIdx].card;
  expect(treasurer?.points).toBe(10 + 4);
});

it("Full blue row draws card from deck", () => {
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "blue");
    const addWarrior = _.partial(addCardToBoard, "0", warrior);
    const addWarriors = _.flow(
      addWarrior(nCols + 1),
      addWarrior(nCols + 2),
      addWarrior(nCols + 3),
      addWarrior(nCols + 4),
      addCardToHand("0", warrior)
    );
    return addWarriors(initState);
  });
  const client = Client({
    game: scenario,
  });
  const preState = client.getState();
  if (!preState) {
    throw Error("No state");
  }
  const preDeck = preState.G.deck;
  const preHand = getPlayerState(preState.G, "0").hand;
  const warrior = _.last(preHand);
  expect(warrior?.name == "Warrior");
  client.moves.playCardFromHand(warrior?.id, nCols + 5, "0");
  const postState = client.getState();
  if (!postState) {
    throw Error("No state");
  }
  const postDeck = postState.G.deck;
  const postHand = getPlayerState(postState.G, "0").hand;
  expect(postHand?.length).toBe(preHand?.length);
  expect(postDeck?.length).toBe((preDeck.length || 0) - 1);
  const preDeckTop = preDeck?.[0];
  expect(_.last(postHand)?.id).toBe(preDeckTop?.id);
});

it("Full green row draws card from graveyard", () => {
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "green");
    const deadCard = makeCard("Priest", "blue");
    const addWarrior = _.partial(addCardToBoard, "0", warrior);
    const addWarriors = _.flow(
      addCardToBoard("0", deadCard, nCols + 1),
      boardToGraveyard("0"),
      addWarrior(1),
      addWarrior(2),
      addWarrior(3),
      addWarrior(4),
      addCardToHand("0", warrior)
    );
    return addWarriors(initState);
  });
  const client = Client({
    game: scenario,
  });
  const preState = client.getState();
  if (!preState) {
    throw Error("No state");
  }
  const preGraveyard = getPlayerState(preState.G, "0").graveyard;
  const preHand = getPlayerState(preState.G, "0").hand;
  const warrior = _.last(preHand);
  expect(warrior?.name == "Warrior");
  client.moves.playCardFromHand(warrior?.id, 5, "0");
  const postState = client.getState();
  if (!postState) {
    throw Error("No state");
  }
  const postGraveyard = getPlayerState(postState.G, "0").graveyard;
  const postHand = getPlayerState(postState.G, "0").hand;
  expect(postHand?.length).toBe(preHand?.length);
  expect(postGraveyard?.length).toBe((preGraveyard.length || 0) - 1);
  const preGraveyardTop = preGraveyard?.[0];
  expect(_.last(postHand)?.id).toBe(preGraveyardTop?.id);
});

it("Full red row kills last card from opponent", () => {
  const scenario = makeScenario((initState, ctx) => {
    const warrior = makeCard("Warrior", "red");
    const opponentWarrior = makeCard("Smith", "green");
    const addWarrior = _.partial(addCardToBoard, "0", warrior);
    const addWarriors = _.flow(
      addWarrior(2 * nCols + 1),
      addWarrior(2 * nCols + 2),
      addWarrior(2 * nCols + 3),
      addWarrior(2 * nCols + 4),
      addCardToBoard("1", opponentWarrior, 0),
      addCardToBoard("1", opponentWarrior, 1),
      addCardToHand("0", warrior)
    );
    return addWarriors(initState);
  });
  const client = Client({
    game: scenario,
  });
  const preState = client.getState();
  if (!preState) {
    throw Error("No state");
  }
  const opponentPreBoard = getPlayerState(preState.G, "1").board;
  // Last card placed by opponent
  console.log("Card", opponentPreBoard.cardSlots[1].card?.name);
  expect(opponentPreBoard.cardSlots[1].card?.name).toBe("Smith");
  const preHand = getPlayerState(preState.G, "0").hand;
  const warrior = _.last(preHand);
  expect(warrior?.name).toBe("Warrior");
  client.moves.playCardFromHand(warrior?.id, 2 * nCols + 5, "0");
  const postState = client.getState();
  if (!postState) {
    throw Error("No state");
  }
  const opponentPostBoard = getPlayerState(postState.G, "1").board;
  // Card should have been removed
  expect(opponentPostBoard.cardSlots[1].card).toBeFalsy();
});
