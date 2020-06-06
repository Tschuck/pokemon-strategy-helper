const pokedex = require('../data/pokemon.json');
const allTypes = require('../data/type');
const { findElementInArray, getIdFromUrl, sortByKey, ensureObjEntry } = require('../utils');
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

const getFlatTypes = (pokemon) => pokemon.types.map(({ type }) => type.name);

const calculateAverageDmg = (pokemon, move) => {
  // get all types that gets double dmg from this move
  const doubleDamageTo = findElementInArray(allTypes, 'name', move.type).damage_relations.double_damage_to;
  // calculate stat average for all double dmg to types
  const targetStats = { };
  doubleDamageTo.forEach((type) => {
    Object.keys(typeAverage[type]).forEach((statKey) => {
      if (statKey !== 'total') {
        ensureObjEntry(targetStats, statKey, []);
        targetStats[statKey].push(typeAverage[type][statKey].avg); 
      }
    });
  });
  // calculate average of possible target stats
  Object.keys(targetStats).forEach((statKey) => {
    targetStats[statKey] = parseInt(targetStats[statKey].reduce((a, b) => a + b, 0) / targetStats[statKey].length);
  });

  const types1 = getFlatTypes(pokemon);
  const stats1 = getPokemonStats(pokemon);
  const types2 = doubleDamageTo;
  const stats2 = targetStats;
  const dmgType = move.dmgClass === 'physical' ? 'attack' : 'special-attack';
  const defenseType = move.dmgClass === 'physical' ? 'defense' : 'special-defense';
  // calculating everytime from level 1 with base stats for generel purposes
  // sample from https://www.pokewiki.de/Schaden
  let dmg = 50 * 2; // level adjust for level 50 with base stats
  dmg = Math.floor(dmg / 5); // level adjust 2
  dmg = Math.floor(dmg + 2); // level adjust 3
  dmg = Math.floor(dmg * move.power); // base damage move
  dmg = Math.floor(dmg * stats1[dmgType]); // damage pokemon 1
  dmg = Math.floor(dmg / 50); // general reduce
  dmg = Math.floor(dmg / stats2[defenseType]); // defense of pokemon 2);
  dmg = Math.floor(dmg * 1); // F1
  dmg = Math.floor(dmg + 2);
  dmg = Math.floor(dmg * (move.flinch_chance === 100 ? 2 : 1)); // critical hit
  dmg = Math.floor(dmg * 1); // F2
  dmg = Math.floor(dmg * 100); // maximum random factor
  dmg = Math.floor(dmg / 100);
  dmg = Math.floor(dmg * (types1.indexOf(move.type) !== -1 ? 1.5 : 1)); // STAB factor
  dmg = Math.floor(dmg * (types2.indexOf(move.type) !== -1 ? 2 : 1)); // enemy type target
  dmg = Math.floor(dmg * 1); // ignore multiple type calculation
  dmg = Math.floor(dmg * 1);; // F3

  return dmg;
};

const categorizePokemonMoves = (pokemon) => {
  const moves = pokemon.moves.map((move) => getFormattedMoveById(getIdFromUrl(move.url)));
  const dmgMoves = { };
  const statusMoves = {
    heals: sortByKey(moves.filter((move) => move.healing > 0), [ 'healing' ]),
    drains: sortByKey(moves.filter((move) => move.drain > 0), [ 'drain', 'power' ]),
    field: moves.filter((move) => move.target === 'entire-field'),
    opponentField: moves.filter((move) => move.target === 'opponents-field'),
    userField: moves.filter((move) => move.target === 'users-field'),
    statIncrease: {},
    statDecrease: {},
  };

  // checkup stat change attacks
  moves.forEach((move) => {
    move.stat_changes.forEach((change) => {
      const toApply = change.type > 0 ? statusMoves.statIncrease : statusMoves.statDecrease;
      ensureObjEntry(toApply, change.stat, []);
      toApply[change.stat].push({
        ...change,
        accuracy: move.accuracy,
        id: move.id,
        power: move.power,
        averageDmg: calculateAverageDmg(pokemon, move),
      });
      toApply[change.stat] = sortByKey(toApply[change.stat], [
        { key: 'type', reverse: change.type < 0 },
        'power'
      ]);
    });
  });

  // checkup dmg moves
  moves.forEach((move) => {
    if (move.power > 0) {
      ensureObjEntry(dmgMoves, move.type, []);
      dmgMoves[move.type].push({
        averageDmg: calculateAverageDmg(pokemon, move),
        ...move,
      });
      dmgMoves[move.type] = sortByKey(dmgMoves[move.type], [ 'averageDmg' ]);
    }
  });

  // return array
  return {
    statusMoves,
    dmgMoves,
  };
};

/**
 * Gets the stastic for pokemon.
 *
 * @param      {<type>}  id      The identifier
 * @return     {Object}  The stastic for pokemon.
 */
const getStasticForPokemon = (id) => {
  const pokemon = findElementInArray(pokedex, 'id', 3);
  const types = getFlatTypes(pokemon);
  const stats = getPokemonStats(pokemon);

  return {
    name: pokemon.name,
    stats,
    types,
    moves: categorizePokemonMoves(pokemon),
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
