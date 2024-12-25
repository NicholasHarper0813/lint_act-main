function capitalizeFirstLetter(str) 
{
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function removeTrailingPeriod(str) 
{
	return str[str.length - 1] === "." ? str.substring(0, str.length - 1) : str;
}

module.exports = 
{
	capitalizeFirstLetter,
	removeTrailingPeriod,
};
