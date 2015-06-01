/*
	store a message for someone to display the next time the speak
*/
const Promise = require('bluebird');
const levelup = require('levelup');

var db = levelup('./messages.db');

var tell = Promise.method(function(data, userData) {
	console.log(Array(80).join('='));
	console.log('tell-data', data);
	console.log(Array(80).join('='));
	console.log('tell-userData', userData);
	var userId = data.matches[1];
	var userMessage = data.matches[2];
	var userStorage = {};
	return new Promise(function(resolve,reject) {
		db.get(userId,
		function(err,value) {
			if(!err) {
				userStorage = JSON.parse(value);
				console.log(value);
				userStorage.read = false;
				userStorage.notified = null;
				userStorage.messages.push({
					from: userData.user.name,
					text: userMessage
				});
				db.put(userId, JSON.stringify(userStorage));
			} else {
				userStorage.messages = [];
				userStorage.messages.push(userMessage);
				db.put(userId, JSON.stringify(userStorage));
			}
			resolve({text: "OK, I'll tell them about "+userMessage})
		})
	});
});

var speak = Promise.method(function(data, userData) {
	return new Promise(function(resolve,reject) {
		db.get(userData.user.id,
			function(err, value) {
				if(!err) {
					value = JSON.parse(value)
					if(value.messages != null && value.messages.length) {
						resolve({text: "You have messages, type `!read` to see them."})
					}
				} else {
					reject(err)
				}
			}
		);
	});
});

exports.load = function(registry) {
	var helpText = null;

	registry.register(
		'messages', //plugin name
		/^[`|!]tell\s*?<@(.*?)>\s*?(.*?)$/im, // trigger regex
		tell, // function to run
		helpText // help text
	);

/*
	registry.register(
		'messages', //plugin name
		/^[`|!]read\s*?$/im, // trigger regex
		read, // function to run
		helpText // help text
	);
*/
	// this will listen to everthing else
	registry.register(
		'messages_listener',
		/^(?![`|!]tell).*/,
		speak,
		null
	);
	return true;
}
