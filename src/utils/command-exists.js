const checkForCommand = require("command-exists");

async function commandExists(command) 
{
	try 
	{
		await checkForCommand(command);
		return true;
	} 
	catch (error) 
	{
		return false;
	}
}

module.exports = commandExists;
