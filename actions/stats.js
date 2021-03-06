const pokedex = require('../data/pokemon.json');
const pokedexEvolved = require('../data/evolution-chain.json');
const { findElementInArray } = require('../utils');

// enhance average stat value with this amount to get clearer results for the over / under estimation 
const percentageThreshold = 0;
// check if only first or both pokemon types should be checked
const typeSlots = [ 1, 2, ];
// calculate over / under estimations with the amount of all pokemon (if false, only internal type will be used)
const useOverAllStats = true;

/**
 * Calculates a stat object for a specific list of stats. Also can take a reference percentage
 * object, to calculate to over and under values.
 *
 * @param      {Array<number>}  statList     list of stats
 * @param      {any}            overAllPerc  result of a getStatPercentage (mostly used with the
 *                                           overall perc)
 * @return     {any}            new percentage object with the average stat values and a calculation
 *                              of over / under percentage distribution
 */
const getStatPercentageObj = (statList, overAllPerc) => {
  let total = 0;
  statList.forEach(statValue => total += statValue)
  const average = useOverAllStats && overAllPerc
    ? overAllPerc.avg
    : Math.round(total / statList.length);
  const statObj = {
    avg: Math.round(total / statList.length),
    over: statList.filter(statValue => statValue >= average).length,
    overAdj: statList.filter(statValue => statValue >= (average + percentageThreshold)).length,
    under: statList.filter(statValue => statValue <= (average + percentageThreshold)).length,
    underAdj: statList.filter(statValue => statValue <= average).length,
    total: statList.length,
  };
  // average percentage within this type
  statObj.perc = {
    over: Math.round(((statObj.over)*100)/statObj.total),
    under: Math.round(((statObj.under)*100)/statObj.total),
    overAdj: Math.round(((statObj.overAdj)*100)/statObj.total),
    underAdj: Math.round(((statObj.underAdj)*100)/statObj.total),
  };

  return statObj;
};

/**
 * Return a object with all types and it's stat average objects.
 *
 * @return     {any}  {type: statAverageObj}
 */
const getTypeAverage = () => {
  const statsPerType = { };
  const overAllStats = { };

  pokedexEvolved.full.forEach(id => {
    const pokemon = findElementInArray(pokedex, 'id', id);
    typeSlots.forEach((typeIndex) => {
      const typeObj = findElementInArray(pokemon.types, 'slot', typeIndex)

      if (typeObj) {
        const type = typeObj.type.name
        if (!statsPerType[type]) {
          statsPerType[type] = {};
        }
        pokemon.stats.forEach(({ base_stat, stat }) => {
          if (!overAllStats[stat.name]) {
            overAllStats[stat.name] = [];
          }
          if (!statsPerType[type][stat.name]) {
            statsPerType[type][stat.name] = [];
          }
          statsPerType[type][stat.name].push(base_stat); 
          overAllStats[stat.name].push(base_stat); 
        }); 
      }
    });
  });

  const averageData = {
    'all-types': {},
  };
  const highestTypeForStats = {};
  Object.keys(statsPerType).forEach(type => {
    const statsForType = statsPerType[type];
    const typeAverageObj = { };
    const availableStats = Object.keys(statsForType);
    availableStats.forEach(statName => {
      if (!averageData['all-types'][statName]) {
        averageData['all-types'][statName] = getStatPercentageObj(overAllStats[statName])
      }

      typeAverageObj[statName] = getStatPercentageObj(
        statsForType[statName],
        averageData['all-types'][statName],
      );
    });
    averageData[type] = {
      total: statsForType[availableStats[0]].length,
      ...typeAverageObj,
    };
  });

  return averageData;
};

/**
 * Formats the result of the getTypeAverage to a loggable table.
 *
 * @return     {Array<any>}  The average display table.
 */
const getAverageDisplayTable = () => {
  const averageData = getTypeAverage();
  return Object
    .keys(averageData)
    .map(type => {
      const logObj = { type };

      Object.keys(averageData[type]).forEach(stat => {
        const statObj = averageData[type][stat];

        if (statObj.avg) {
          logObj[stat] = `~${statObj.avg} | ${statObj.perc.overAdj}%`;
        } else {
          logObj[stat] = statObj;
        }
      });

      return logObj;
    });
}

const getPokemonStats = (pokemon) => {
  const stats = {};
  Object(pokemon.stats).forEach(({ base_stat, stat }) => {
    stats[stat.name] = base_stat;
  });
  return stats;
};

const action = () => {
  console.log('\nCalculate type-stat average\n');
  console.log(`  percentageThreshold: +${percentageThreshold}`);
  console.log(`  typeSlots: ${typeSlots}`);
  console.log(`  useOverAllStats: ${useOverAllStats}\n`);
  console.table(getAverageDisplayTable());
};

module.exports = {
  action,
  getAverageDisplayTable,
  getPokemonStats,
  getTypeAverage,
};
