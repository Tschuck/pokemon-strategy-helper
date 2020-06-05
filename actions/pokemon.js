const pokedex = require('../data/pokemon.json');
const allTypes = require('../data/type');
const { findElementInArray, getIdFromUrl, sortByKey } = require('../utils');
const { getFormattedMoveById } = require('./moves');
const { getTypeAverage, getPokemonStats } = require('./stats');

const typeAverage = getTypeAverage();
const minimumAttackPower = 0;
// increase / decrease stat threshhold checks
const statAdjustor = 0;

// possbile roles
//   wall: high defense
//   Wallbreaker: high attack / special attack
//   Stallbreaker: prevent from setting status effects
//   Entry Hazard-Setter: set entry hazard
//   Suicide Leads: set entry hazard and possibly die
//   Entry Hazard remove: remove entry hazards
//   Clerics: heal / remove stat effects of team mates
//   Trapper: prevent from switch
//   Set-Up-Sweeper: increase stats with stance abilities
//   Revenger: finish a damaged pokemon, high Initiative
//   Pivot: force to switch
//   

const getSuggestedDmgClass = (pokemon, type, returnObj = false) => {
  if (!type) {
    return;
  }

  const stats = getPokemonStats(pokemon);
  const physical = [];
  const special = [];

  // if stats are very distant from each other, prever this one
  if ((stats.attack + statAdjustor) > stats['special-attack']) {
    physical.push({ attack: stats.attack, 'special-attack': stats['special-attack'] });
  } else if ((stats['special-attack'] + statAdjustor) > stats.attack) {
    special.push({ attack: stats.attack, 'special-attack': stats['special-attack'] });
  }

  // check all double dmg types and check how to do the most damage 
  const doubleDamageTo = findElementInArray(allTypes, 'name', type).damage_relations.double_damage_to;
  doubleDamageTo.forEach((dmgToType) => {
    const typeAvgObj = typeAverage[dmgToType];
    const defense = typeAvgObj['defense'].perc.overAdj;
    const spDefense = typeAvgObj['special-defense'].perc.overAdj;
    let pushTo;
    if (defense + statAdjustor > spDefense) {
      pushTo = physical;
    } else if (defense + statAdjustor < spDefense) {
      pushTo = special;
    }

    if (pushTo) {
      pushTo.push({
        'special-defense': spDefense,
        defense,
        type: dmgToType,
      });
    }
  });

  if (returnObj) {
    return { physical, special };
  }

  return physical.length === special.length
    ? 'neutral'
    : (physical.length > special.length ? 'physical' : 'special');
};

const getPokemonMoveCategories = (pokemon) => {
  const moves = pokemon.moves.map((move) => getFormattedMoveById(getIdFromUrl(move.url)));
  const types = pokemon.types.map(({ type }) => type.name);
  const sugDmgClass1 = getSuggestedDmgClass(pokemon, types[0]);
  const sugDmgClass2 = getSuggestedDmgClass(pokemon, types[1]);
  // sort moves by minimum power and the prevered damage type
  const moveFilter = (move, type, damageClass) =>
    move.power > minimumAttackPower
      && move.type === type
      && (damageClass === 'neutral' || damageClass === move.damageClass);
  let primary1 = sortByKey(moves.filter((move) => moveFilter(move, types[0], sugDmgClass1)), [ 'power' ]);
  let primary2 = sortByKey(moves.filter((move) => moveFilter(move, types[1], sugDmgClass2)), [ 'power' ]);

  const heal = sortByKey(
    moves.filter((move) => move.healing > 0 || move.drain > 0),
    [ 'power', 'healing', 'drain' ],
  );

  const drains = sortByKey(
    moves.filter((move) => move.drain > 0),
    [ 'power', 'drain' ],
  );

  return {
    drains,
    heal,
    primary1,
    primary2,
  }
};

/**
 * Gets the stastic for pokemon.
 *
 * @param      {<type>}  id      The identifier
 * @return     {Object}  The stastic for pokemon.
 */
const getStasticForPokemon = (id) => {
  const pokemon = findElementInArray(pokedex, 'id', 3);
  const types = pokemon.types.map(({ type }) => type.name);
  const stats = getPokemonStats(pokemon);
  const moves = pokemon.moves.map((move) => getFormattedMoveById(getIdFromUrl(move.url)));
  const moveCategories = getPokemonMoveCategories(pokemon);

  // const selectedMoves = [
  //   moves.primary1.slice(0, 3),
  //   moves.primary2.slice(0, 3),
  // ];

  return {
    name: pokemon.name,
    moves,
    moveCategories,
    stats,
    types,
  };
};

const action = async (id) => {
  const statistic = getStasticForPokemon(id);

  console.log(`\n${id}. ${statistic.name}`);
  console.log(JSON.stringify(statistic, null, 2));
};

module.exports = {
  action,
};
