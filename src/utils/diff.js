const parseDiff = require("parse-diff");

function parseErrorsFromDiff(diff) 
{
	const errors = [];
	const files = parseDiff(diff);
	for (const file of files) 
	{
		const { chunks, to: path } = file;
		for (const chunk of chunks) 
		{
			const { oldStart, oldLines, changes } = chunk;
			const chunkDiff = changes.map((change) => change.content).join("\n");
			errors.push({
				path,
				firstLine: oldStart,
				lastLine: oldStart + oldLines,
				message: chunkDiff,
			});
		}
	}
	return errors;
}

module.exports = {
	parseErrorsFromDiff,
};
