/**
Slack Webhook Handler
*/
"use strict";
//const request = require('request');
const WebSocket = require('ws');
const _ = require('lodash');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const levelup = require('levelup');
var db = levelup('./slackbot.db');

var ws;
var messageID = 0;
var ws_retries = 0;
var ws_max_retries = 5;
// SET UP SLACK
const conf = require(process.env.CONFIG || "./config.json");
const pluginRegistry = {
	names: [],
	commands: {},
	help: {},
	register: function(name, regex, func, help) {
		pluginRegistry.commands[name]= {
			r: regex, // the regex to parse
			f: func   // the function to run
		};
		if(help) {
			pluginRegistry.help[name] = help;
		}
		console.log("==================");
		console.log("Registering plugin");
		console.log(name, regex);
	}
};

// load the plugins
conf.plugins.forEach(function(name) {
	const plugin = require('./plugins/'+name);
	const status = plugin.load(pluginRegistry);
});

var SlackBot = {
	store: {
		put: Promise.method(function(key, data) {
			return new Promise(function (resolve, reject) {
				db.put(key, data, function (err) {
					if (err) {
						return reject(err);
					} else {
						return resolve(true);
					}
				});
			});
		}),
		get: Promise.method(function(key) {
			return new Promise(function (resolve, reject) {
				db.get(key, function (err, value) {
					if (err) {
						return reject(err);
					} else {
						return resolve(value);
					}
				});
			});
		})
	},
	getUserData: Promise.method(function(data) {
		return request.getAsync({
			url: "https://slack.com/api/users.info",
			qs: {
				token: conf.api_token,
				user: data.user
			}
		}).spread(function(response, body) {
			if(response.statusCode == 200) {
				var userData = JSON.parse(body);
				// run our callback with the results
				return body
			}
		}).error(function(err) { return false });
	}),
	sendMessage: Promise.method(function(channel, message) {
		var queryParams = {};
		queryParams = _.merge(
			{
				token: conf.api_token,
				channel: channel,
				username: conf.username,
				icon_url: conf.icon_url,
				as_user: false,
				link_names: 1
			},
			message
		);
		if(queryParams.attachments) {
			queryParams.attachments = JSON.stringify(queryParams.attachments)
		}
		return request.getAsync({
			url: "https://slack.com/api/chat.postMessage",
			method: "POST",
			qs: queryParams
		}).spread(function(response, body) {
			if(response.statusCode == 200) {
				var userData = JSON.parse(body);
				return body
			}
		});
	})
};

function openWebsocket(socket) {
	var ME = socket.self.id;

	// the socket needs to be ok in order to be opened
	if (socket.ok !== true) {
		console.error("Failed to open socket");
		return false
	}

	ws = new WebSocket(socket.url);

	ws.on('open', function open() {
		// reset the retries count for future disconnects
		ws_retries = 0;
		console.log('Websocket open at %s', socket.url);
	});

	ws.on('close', function () {
		// restart the websocket
		start();
	});

	ws.on('message', function (data, flags) {
		var data = JSON.parse(data)
			, text = null;

		if (data.type == "message") {
			console.log(data)
			text = data.text ? data.text.trim() : null;
			var pipedCommands = text ? text.split('|') : [];
			console.log(pipedCommands)
			if (!data.subtype) {
				// plain message
				processCommands(data, pipedCommands)
				.then(function (r) {
					console.log("message", r);
					SlackBot.sendMessage(data.channel, r);
				})
				.catch(function (e) {
					console.error(e);
					SlackBot.sendMessage(data.channel, {text: e});
				});
			}
		}
	});

	var processCommands = Promise.method(function (data, cmds) {
		if (cmds) {
			var cmd = cmds.shift().trim();
			return new Promise(function (resolve, reject) {
				_.forOwn(pluginRegistry.commands, function (command, name) {
					if (command.r.test(cmd)) {
						data.matches = command.r.exec(cmd);
						SlackBot.getUserData(data)
							.then(function (userData) {
								var userData = JSON.parse(userData);
								return command.f(data, userData, SlackBot)
							})
							.then(function (message) {
								if (!cmds.length) {
									resolve(message);
								} else {
									cmds[0] += ' '+message.text;
									resolve(processCommands(data, cmds));
								}
							})
							.catch(function (e) {
								console.log(e);
								reject();
							});
					}
				});
			});
		} else {
			return false
		}
	});
}

function start() {
	if(ws_retries++ < ws_max_retries) {
		request.getAsync({
			url: "https://slack.com/api/rtm.start",
			qs: { token: conf.rtm_token }
		}).spread(function(response,body) {
			if(response.statusCode == 200) {
				body = JSON.parse(body);
				openWebsocket(body);
			} else {
				// try again
				console.log("retrying in "+ (ws_retries*5000)/1000+" seconds")
				setTimeout(start, ws_retries*5000)
			}
		});
	}
}

// ALL SYSTEMS GO!
start();
