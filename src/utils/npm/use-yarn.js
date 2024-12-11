const { existsSync } = require("fs");
const { join } = require("path");
const YARN_LOCK_NAME = "yarn.lock";

function useYarn(pkgRoot) 
{
	const lockfilePath = pkgRoot ? join(pkgRoot, YARN_LOCK_NAME) : YARN_LOCK_NAME;
	return existsSync(lockfilePath);
}

module.exports = { useYarn };
