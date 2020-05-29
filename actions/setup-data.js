const axios = require('axios');
const fs = require('fs');
const path = require('path');

const buildPokedex = async () => {
  let pokedex = [ ];
  let next = 'https://pokeapi.co/api/v2/pokemon?offset=0&limit=50';

  while (next) {
    const { data } = await axios.get(next);
    const results = await Promise.all(data.results.map(async (pokemon) => {
      return (await axios.get(pokemon.url)).data;
    }));

    next = data.next;
    pokedex = [ ...pokedex, ...results, ];

    console.log(`loaded pokedex: ${pokedex.length} / ${ data.count }`);
  }

  return pokedex;
};

const getNestedEvolutions = (evolutionChain) => {
  let evolutions = [...evolutionChain.evolves_to];

  evolutionChain.evolves_to.forEach(subEvolution => {
    evolutions = [
      ...evolutions,
      ...getNestedEvolutions(subEvolution),
    ]
  })

  return evolutions;
};

const getIdFromUrl = (url) => {
  const splitUrl = url.split('/');
  return parseInt(splitUrl[splitUrl.length - 2]);
}

const buildFullEvolvedDex = async () => {
  // collect all evolving pokemon, to add those, that are not evolve, but actual "fully evolved",
  // because they never evolve
  let allEvolving = [];
  // only pokemon that are full evolved
  let fullEvolved = [];
  let next = 'https://pokeapi.co/api/v2/evolution-chain?offset=0&limit=50';

  while (next) {
    const { data } = await axios.get(next);
    await Promise.all(data.results.map(async (pokemon) => {
      let chainObj = (await axios.get(pokemon.url)).data.chain;
      let evolutions = getNestedEvolutions(chainObj);

      allEvolving = [
        ...allEvolving,
        ...evolutions.map(subEvolution => getIdFromUrl(subEvolution.species.url))
      ];

      fullEvolved = [
        ...fullEvolved,
        ...evolutions
          .filter(subEvolution => subEvolution.evolves_to.length === 0)
          .map(subEvolution => getIdFromUrl(subEvolution.species.url)),
      ];
    }));

    next = data.next;

    console.log(`loaded evolutions: ${allEvolving.length} / ${ data.count }`);
  }

  // checkup pokedex for pokemon that are not evolving
  const pokedex = require('../data/pokedex.json');
  pokedex.forEach((pokemon) => {
    if (allEvolving.indexOf(pokemon.id) === -1) {
      fullEvolved.push(pokemon.id);
    }
  });

  return fullEvolved.sort();
};

const action = async () => {
  const files = [
    {
      path: `${__dirname}/../data/pokedex.json`,
      action: buildPokedex,
    },
    {
      path: `${__dirname}/../data/pokedex.evolved.json`,
      action: buildFullEvolvedDex,
    }
  ];

  for (let fileConfig of files) {
    const filePath = path.resolve(fileConfig.path);
    if (!fs.existsSync(filePath)) {
      console.log(`building file: ${filePath}`);
      fs.writeFileSync(
        filePath,
        JSON.stringify(await fileConfig.action(), null, 2),
      );
    }    
  }
}

module.exports = {
  action,
  buildFullEvolvedDex,
  buildPokedex,
  getNestedEvolutions,
};
