const fs = require('fs');
const yargs = require('yargs');

(async () => {
  const argv = yargs.argv;
  if (fs.existsSync(`./actions/${argv._[0]}.js`)) {
    console.log(`start action: ${argv._[0]}`);
    require(`./actions/${argv._[0]}.js`).action.apply(
      null,
      argv._.slice(1, argv._.length),
    );
  } else {
    console.log(`action not found: ${argv._[0]}`);
  } 
})();
