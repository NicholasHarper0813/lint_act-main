const { useYarn } = require("./use-yarn");

function getNpmBinCommand(pkgRoot)
{
	return useYarn(pkgRoot) ? "yarn run --silent" : "npx --no-install";
}

module.exports = { getNpmBinCommand };
