const Promise = require('bluebird');
const levelup = require('levelup');
var db = levelup('./plusplus.db');

var storageModel = {
	users: {
		username: {
			score: 0,
			reasons: {
				reason: 0
			}
		}
	},
	last: {
		user: "",
		reason: ""
	}
};

var plusplus = Promise.method(function(data, userData, SlackBot) {

});

var logToConsole = Promise.method(function(data, userData, SlackBot) {
	console.log(data);
	console.log(userData);
	return true;
});

exports.load = function(registry) {
	registry.register(
		//plugin name
		'plusplus simple',
		// trigger regex
		new RegExp([
		  /^/               // from beginning of line
		 ,/([\s\w'@.\-:]*)/ // the thing being upvoted, which is any number of words and spaces
		 ,/\s*/             // allow for spaces after the thing being upvoted (@user ++)
		 ,/(\+\+|--|—)/     // the increment/decrement operator ++ or --
		 ,/(?:\s+(?:for|because|cause|cuz|as)\s+(.+))?/ // optional reason
		 ,/$/ // end of line
		].map(function(r) {return r.source}).join(''),'i'),
		// function to run
		plusplus,
		// help text
		'Gimme Some Points'
	);

	registry.register(
		//plugin name
		'plusplus log',
		// trigger regex
		/^[`!]plusplus log/im,
		// function to run
		logToConsole,
		// help text
		'Gimme Some Points'
	);


	return true;
};
