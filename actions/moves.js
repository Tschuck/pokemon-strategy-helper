const moves = require('../data/move.json');

const ensureObjEntry = (obj, key, defaultValue) => {
  if (!obj[key]) {
    obj[key] = defaultValue;
  }
};

const formatMove = (move) => { 
  const formatted = {
    id: move.id,
    name: move.name,
    // percentage to reach the target
    accuracy: move.accuracy,
    // basic attack power
    power: move.power,
    // Number, how often the attack can be used.
    pp: move.pp,
    // selected-pokemon => choose target
    // all-opponents => all enemies
    // entire-field => weather condition (e.g. sandstorm)
    // user => self target
    // users-field => all on users side (e.g. shield for all my pokemon)
    // opponents-field => all on opponents side (e.h. entry hazard) 
    target: move.target.name,
  };

  if (move.meta) {
    // increased crit change (0 / 1)
    formatted.crit_rate = move.meta.crit_rate;
    // adds / removes health from the executer, relative to the dealt damage
    // drain = 50, damgage = 100 => self heal 50
    // drain -30, damage = 100 => self damage 30
    formatted.drain = move.meta.drain;
    // percentage that the enemy cannot attack ("zurück schrecken")
    formatted.flinch_chance = move.meta.flinch_chance;
    // heals of this percentage (healing % / max health)
    formatted.healing = move.meta.healing;
    // attack hits multiple times (min-hits to max-hits)
    formatted.min_hits = move.meta.min_hits;
    formatted.max_hits = move.meta.max_hits;
    // effect over multiple turns
    formatted.max_turns = move.meta.max_turns;
    formatted.min_turns = move.meta.min_turnsv
    // percentage to apply a specific stat change
    formatted.stat_chance = move.meta.stat_chance;
  }

  if (move.stat_changes) {
    formatted.stat_changes = move.stat_changes.map((change) => ({
      type: change.change,
      stat: change.stat.name,
    }));
  }

  return formatted;
}

const getMoveOverview = () => {
  const overview = { };

  moves.forEach((move) => {
    const type = move.type.name;
    const dmgClass = move.damage_class.name;

    ensureObjEntry(overview, type, {});
    ensureObjEntry(overview[type], dmgClass, [ ]);
    overview[type][dmgClass].push(formatMove(move));
  });

  return overview;
};

const printMoveInfo = () => {
  const moveOverview = getMoveOverview();
  Object.keys(moveOverview).forEach((type) => {
    console.log(`\n\n----------------------------- ${type} -----------------------------`);

    Object.keys(moveOverview[type]).forEach((statName) => {
      console.log(`${statName}`);
      
      moveOverview[type][statName] = moveOverview[type][statName].map((move) => {
        if (move.stat_changes) {
          move.stat_changes = move.stat_changes
            .map((change) => `${change.type}-${change.stat}`)
            .join(' | ');
        }
        return move;
      });

      console.table(moveOverview[type][statName]);
    });
  });
};

module.exports = {
  action: printMoveInfo,
};
