const { existsSync } = require("fs");
const { join } = require("path");
const { getSummary } = require("./utils/lint-result");
const { createCheck } = require("./github/api");
const { getContext } = require("./github/context");
const core = require("@actions/core");
const git = require("./git");
const linters = require("./linters");

async function runAction() 
{
	const context = getContext();
	const commit = core.getInput("commit") === "true";
	const autoFix = core.getInput("auto_fix") === "true";
	const gitName = core.getInput("git_name", { required: true });
	const gitEmail = core.getInput("git_email", { required: true });
	const checkName = core.getInput("check_name", { required: true });
	const skipVerification = core.getInput("git_no_verify") === "true";
	const continueOnError = core.getInput("continue_on_error") === "true";
	const commitMessage = core.getInput("commit_message", { required: true });
	const neutralCheckOnWarning = core.getInput("neutral_check_on_warning") === "true";
	const isPullRequest = context.eventName === "pull_request" || context.eventName === "pull_request_target";

	if (context.eventName === "pull_request" && context.repository.hasFork)
	{
		core.error(
			"This action does not have permission to create annotations on forks. You may want to run it only on `pull_request_target` events with checks permissions set to write. See https://docs.github.com/en/actions/learn-github-actions/workflow-syntax-for-github-actions#permissions for details.",
		);
	}
	if (isPullRequest && context.repository.hasFork && autoFix) 
	{
		core.error(
			"This action does not have permission to push to forks. You may want to run it only on `push` events.",
		);
	}

	if (autoFix) {
		git.setUserInfo(gitName, gitEmail);
	}
	if (isPullRequest) 
	{
		git.checkOutRemoteBranch(context);
	}

	let headSha = git.getHeadSha();
	let hasFailures = false;
	const checks = [];

	for (const [linterId, linter] of Object.entries(linters))
	{
		if (core.getInput(linterId) === "true")
		{
			core.startGroup(`Run ${linter.name}`);

			const fileExtensions = core.getInput(`${linterId}_extensions`, { required: true });
			const args = core.getInput(`${linterId}_args`);
			const prefix = core.getInput(`${linterId}_command_prefix`);
			const lintDirRel = core.getInput(`${linterId}_dir`) || ".";
			const linterAutoFix = autoFix && core.getInput(`${linterId}_auto_fix`) === "true";
			const lintDirAbs = join(context.workspace, lintDirRel);

			if (!existsSync(lintDirAbs)) 
			{
				throw new Error(`Directory ${lintDirAbs} for ${linter.name} doesn't exist`);
			}

			core.info(`Verifying setup for ${linter.name}…`);
			await linter.verifySetup(lintDirAbs, prefix);
			core.info(`Verified ${linter.name} setup`);

			const fileExtList = fileExtensions.split(",");
			core.info(`Will use ${linter.name} to check the files with extensions ${fileExtList}`);

			core.info(
				`Linting ${linterAutoFix ? "and auto-fixing " : ""}files in ${lintDirAbs} ` +
					`with ${linter.name} ${args ? `and args: ${args}` : ""}…`,
			);
			const lintOutput = linter.lint(lintDirAbs, fileExtList, args, linterAutoFix, prefix);
			const lintResult = linter.parseOutput(context.workspace, lintOutput);
			const summary = getSummary(lintResult);
			core.info(
				`${linter.name} found ${summary} (${lintResult.isSuccess ? "success" : "failure"})`,
			);

			if (!lintResult.isSuccess) {
				hasFailures = true;
			}

			if (linterAutoFix && commit) 
			{
				if (git.hasChanges()) 
				{
					git.commitChanges(commitMessage.replace(/\${linter}/g, linter.name), skipVerification);
					git.pushChanges(skipVerification);
				}
			}

			const lintCheckName = checkName
				.replace(/\${linter}/g, linter.name)
				.replace(/\${dir}/g, lintDirRel !== "." ? `${lintDirRel}` : "")
				.trim();

			checks.push({ lintCheckName, lintResult, summary });
			core.endGroup();
		}
	}

	if (isPullRequest && autoFix) 
	{
		headSha = git.getHeadSha();
	}

	core.startGroup("Create check runs with commit annotations");
	let groupClosed = false;
	try 
	{
		await Promise.all(
			checks.map(({ lintCheckName, lintResult, summary }) =>
				createCheck(lintCheckName, headSha, context, lintResult, neutralCheckOnWarning, summary),
			),
		);
	} 
	catch (err) 
	{
		core.endGroup();
		groupClosed = true;
		core.warning("Some check runs could not be created.");
	}
	
	if (!groupClosed) 
	{
		core.endGroup();
	}

	if (hasFailures && !continueOnError) 
	{
		core.setFailed("Linting failures detected. See check runs with annotations for details.");
	}
}

runAction().catch((error) => {
	core.debug(error.stack || "No error stack trace");
	core.setFailed(error.message);
});
