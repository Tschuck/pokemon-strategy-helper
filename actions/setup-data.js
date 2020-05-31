const axios = require('axios');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const basePath = path.resolve(`${__dirname}/..`);
const dataFolder = `${basePath}/data`;
const statusFile = `.status.json`;
const pokeApiUrl = 'https://pokeapi.co/api/v2/';

const utils = {
  /**
   * Require a module without throwing an error. Resturns a default value.
   * @param {string} requirePath path to load
   * @param {any} defaultRequire default return, if path could not be loaded
   */
  safeRequire: (requirePath, defaultRequire) => {
    try {
      return require(`${basePath}/${requirePath}`);
    } catch (ex) {
      return defaultRequire;
    }
  },
  saveData: (pathToSave, value) => {
    const fullPath = `${dataFolder}/${pathToSave}`;
    const splitPath = fullPath.split('/');
    const folderPath = splitPath.slice(0, splitPath.length - 1).join('/');
    fse.ensureDirSync(folderPath);
    fse.writeJSONSync(fullPath, value);
  },
  getIdFromUrl: (url) => {
    const splitUrl = url.split('/');
    return parseInt(splitUrl[splitUrl.length - 2]);
  },
  getNestedEvolutions: (evolutionChain) => {
    let evolutions = [...evolutionChain.evolves_to];

    evolutionChain.evolves_to.forEach(subEvolution => {
      evolutions = [
        ...evolutions,
        ...utils.getNestedEvolutions(subEvolution),
      ]
    })

    return evolutions;
  },
  
  /**
   * Load data from the pokeapi while a next url is given. Run a callback function with the list of loaded entries. 
   *
   * @param {string} type that is used to specify status
   * @param {string} url url to request
   */
  loadApiList: async (type, callback, defaultData) => {
    const status = utils.safeRequire(`data/${statusFile}`, {});
    let typeData = utils.safeRequire(`data/${type}.json`, defaultData);

    console.log(`------------------------------------------------`);
    console.log(` loading ${type}\n`);

    if (!status[type]) {
      status[type] = {
        next: `${pokeApiUrl}${type}?offset=0&limit=50`,
        offset: 0,
        total: 0,
      };
      typeData = defaultData;
    }

    while (status[type].next !== 'finished') {
      console.log(`   - ${status[type].offset} / ${status[type].total}`);

      const { data } = await axios.get(status[type].next);
      typeData = await callback(typeData, data.results);
      status[type].next = data.next;
      status[type].total = data.count;
      status[type].offset += 50;
      if (!status[type].next) {
        status[type].next = 'finished';
      }
      
      utils.saveData(`${type}.json`, typeData);
      utils.saveData(statusFile, status);
    }

    console.log(`\n finished loading ${type}`);
    console.log(`------------------------------------------------`);
    
    return typeData;
  },
};

const buildPokedex = async () => {
  await utils.loadApiList('pokemon', async (previous, newEntries) => {
    const formatted = await Promise.all(newEntries.map(async (pokemon) => {
      const pokemonDetail = (await axios.get(pokemon.url)).data;

      return {
        abilities: pokemonDetail.abilities,
        id: pokemonDetail.id,
        // instead the pokedex file will hit the 180MB
        moves: pokemonDetail.moves.map(move => move.move),
        name: pokemonDetail.name,
        order: pokemonDetail.order,
        species: pokemonDetail.species,
        sprites: pokemonDetail.sprites,
        stats: pokemonDetail.stats,
        types: pokemonDetail.types,
      };
    }));

    return [ ...previous, ...formatted ];
  }, []);
};

const buildFullEvolvedDex = async () => {
  const evolutionData = await utils.loadApiList('evolution-chain', async (previous, newEntries) => {
    await Promise.all(newEntries.map(async (pokemon) => {
      let chainObj = (await axios.get(pokemon.url)).data.chain;
      let evolutions = utils.getNestedEvolutions(chainObj);
      // collect all evolving pokemon, to add those, that are not evolve, but
      // actual "fully evolved", because they never evolve
      previous.all = [
        ...previous.all,
        ...evolutions.map(subEvolution => utils.getIdFromUrl(subEvolution.species.url))
      ];
      // only pokemon that are full evolved
      previous.full = [
        ...previous.full,
        ...evolutions
          .filter(subEvolution => subEvolution.evolves_to.length === 0)
          .map(subEvolution => utils.getIdFromUrl(subEvolution.species.url)),
      ];
    }));

    return previous;
  }, { all: [], full: [] });

  // checkup pokedex for pokemon that are not evolving
  const pokedex = utils.safeRequire('data/pokemon.json'); 
  pokedex.forEach((pokemon) => {
    if (evolutionData.all.indexOf(pokemon.id) === -1) {
      evolutionData.full.push(pokemon.id);
    }
  });

  evolutionData.all = [...new Set(evolutionData.all)].sort();
  evolutionData.full = [...new Set(evolutionData.full)].sort();

  utils.saveData('evolution-chain.json', evolutionData);
};

const buildMoves = async () => {
  await utils.loadApiList('move', async (previous, newEntries) => {
    const formatted = await Promise.all(newEntries.map(async (move) => {
      const result = (await axios.get(move.url)).data;
      return {
        name: move.name,
        accuracy: result.accuracy,
        damage_class: result.damage_class,
        effect_chance: result.effect_chance,
        effect_changes: result.effect_changes,
        effect_entries: result.effect_entries,
        id: result.id,
        meta: result.meta,
        power: result.power,
        pp: result.pp,
        priority: result.priority,
        stat_changes: result.stat_changes,
        target: result.target,
        type: result.type,
      }
    }));

    return [...previous, ...formatted];
  }, []);
};

const action = async () => {
  await buildPokedex();
  await buildFullEvolvedDex();
  await buildMoves();
}

module.exports = {
  action,
  buildFullEvolvedDex,
  buildMoves,
  buildPokedex,
  utils,
};
