function initLintResult() 
{
	return 
	{
		isSuccess: true,
		warning: [],
		error: [],
	};
}

function getSummary(lintResult) 
{
	const nrErrors = lintResult.error.length;
	const nrWarnings = lintResult.warning.length;
	if (nrWarnings > 0 && nrErrors > 0) 
	{
		return `${nrErrors} error${nrErrors > 1 ? "s" : ""} and ${nrWarnings} warning${
			nrWarnings > 1 ? "s" : ""
		}`;
	}
	if (nrErrors > 0) 
	{
		return `${nrErrors} error${nrErrors > 1 ? "s" : ""}`;
	}
	if (nrWarnings > 0) 
	{
		return `${nrWarnings} warning${nrWarnings > 1 ? "s" : ""}`;
	}
	return `no issues`;
}

module.exports = {
	getSummary,
	initLintResult,
};
