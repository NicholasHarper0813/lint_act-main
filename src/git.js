const core = require("@actions/core");
const { run } = require("./utils/action");

function checkOutRemoteBranch(context) 
{
	if (context.repository.hasFork) 
	{
		core.info(`Adding "${context.repository.forkName}" fork as remote with Git`);
		const cloneURl = new URL(context.repository.forkCloneUrl);
		cloneURl.username = context.actor;
		cloneURl.password = context.token;
		run(`git remote add fork ${cloneURl.toString()}`);
	} 
	else 
	{
		core.info(`Adding auth information to Git remote URL`);
		const cloneURl = new URL(context.repository.cloneUrl);
		cloneURl.username = context.actor;
		cloneURl.password = context.token;
		run(`git remote set-url origin ${cloneURl.toString()}`);
	}

	const remote = context.repository.hasFork ? "fork" : "origin";

	core.info(`Fetching remote branch "${context.branch}"`);
	run(`git fetch --no-tags --depth=1 ${remote} ${context.branch}`);

	core.info(`Switching to the "${context.branch}" branch`);
	run(`git branch --force ${context.branch} --track ${remote}/${context.branch}`);
	run(`git checkout ${context.branch}`);
}

function getHeadSha() 
{
	const sha = run("git rev-parse HEAD").stdout;
	core.info(`SHA of last commit is "${sha}"`);
	return sha;
}

function hasChanges() 
{
	const output = run("git diff-index --name-status --exit-code HEAD --", { ignoreErrors: true });
	const hasChangedFiles = output.status === 1;
	core.info(`${hasChangedFiles ? "Changes" : "No changes"} found with Git`);
	return hasChangedFiles;
}

function commitChanges(message, skipVerification) 
{
	core.info(`Committing changes`);
	run(`git commit -am "${message}"${skipVerification ? " --no-verify" : ""}`);
}

function pushChanges(skipVerification) 
{
	core.info("Pushing changes with Git");
	run(`git push${skipVerification ? " --no-verify" : ""}`);
}

function setUserInfo(name, email) 
{
	core.info(`Setting Git user information`);
	run(`git config --global user.name "${name}"`);
	run(`git config --global user.email "${email}"`);
}

module.exports = 
{
	checkOutRemoteBranch,
	commitChanges,
	getHeadSha,
	hasChanges,
	pushChanges,
	setUserInfo,
};
