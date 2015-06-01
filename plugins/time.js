/**
	show the time - cuz, ya know, why not :)
*/

const moment = require('moment');

function turnBackTime(bot) {
	bot.send({
		username: "Clock",
		text: moment().format('llll')
	});
}

exports.load = function(registry) {
	var helpText='Displays the current time.';
	registry.register('time', turnBackTime, helpText);
	return true;
}