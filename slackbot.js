/**
Slack Webhook Handler
*/
"use strict";
//const request = require('request');
const WebSocket = require('ws');
const _ = require('lodash');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));

var _self;
var ws;
var messageID = 0;
var ws_retries = 0;
var ws_max_retries = 5;
// SET UP SLACK
const conf = require(process.env.CONFIG || "./config.json");
const pluginRegistry = {
	names: [],
	commands: {},
	helpTexts: [],
	help: function(helpText) {
		pluginRegistry.helpTexts.push(helpText)
	},
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
	},
	hear: (regex, func) => {
		pluginRegistry.commands[regex.source]= {
			r: regex, // the regex to parse
			f: func   // the function to run
		};
		console.log("==================");
		console.log("Listening for");
		console.log(regex.source);
	},
	respond: (regex, func) => {
		// merge the triggers for the regex
		pluginRegistry.commands[regex.source]= {
			r: new RegExp(
				"^(?:["+conf.triggers+"]|"+conf.username+"|<@"+_self+">)[,:]?\\s*?"+regex.source,
				_.union(regex.flags.split(''),['i','m']).join('')),
			f: func
		};
		console.log("==================");
		console.log("Responding to");
		console.log(pluginRegistry.commands[regex.source].r.source);
	}
};

var SlackBot = (channel) => {
	return {
		self: _self,
		config: conf,
		getUserData: Promise.method(function (data) {
			return request.getAsync({
				url: "https://slack.com/api/users.info",
				qs: {
					token: conf.api_token,
					user: data.user
				}
			}).spread(function (response, body) {
				if (response.statusCode == 200) {
					var userData = JSON.parse(body);
					// run our callback with the results
					return body
				}
			}).error(function (err) {
				return false
			});
		}),
		sendMessage: Promise.method(function (message) {
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
			if (queryParams.attachments) {
				queryParams.attachments = JSON.stringify(queryParams.attachments)
			}
			return request.getAsync({
				url: "https://slack.com/api/chat.postMessage",
				method: "POST",
				qs: queryParams
			}).spread(function (response, body) {
				if (response.statusCode == 200) {
					var userData = JSON.parse(body);
					return body
				}
			}).error((e) => {
				console.log(e)
			});
		}),
		updateMessage: Promise.method(function (message) {
			var queryParams = {};
			queryParams = _.merge(
				{
					token: conf.api_token,
					channel: channel,
					username: conf.username,
					icon_url: conf.icon_url,
					as_user: true,
					link_names: 1
				},
				message
			);
			if (queryParams.attachments) {
				queryParams.attachments = JSON.stringify(queryParams.attachments)
			}
			return request.getAsync({
				url: "https://slack.com/api/chat.update",
				method: "POST",
				qs: queryParams
			}).spread(function (response, body) {
				if (response.statusCode == 200) {
					var userData = JSON.parse(body);
					return body
				}
			});
		})
	}
};

function openWebsocket(socket) {
	// the socket needs to be ok in order to be opened
	if (socket.ok !== true) {
		console.error("Failed to open socket");
		return false
	}

	_self = socket.self.id;

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
			var bot = SlackBot(data.channel);
			text = data.text ? data.text.trim() : null;
			if (!data.subtype) {
				// plain message
				processCommands(bot, data, text);
			}
		}
	});

	var processCommands = (bot, data, cmd) => {
		if (cmd) {
				_.forOwn(pluginRegistry.commands, function (command, name) {
					if (command.r.test(cmd)) {
						var commandData = Object.assign({}, data);
						commandData.matches = command.r.exec(cmd);
						bot.getUserData(data)
						.then(function (userData) {
							var userData = JSON.parse(userData);
							command.f(commandData, userData, bot)
						})
						.catch(function (e) {
							console.log(e);
						});
					}
				});
		}
	}
}

var slackbotHelp = Promise.method(function(data, userData, bot) {
	bot.sendMessage({
		text: pluginRegistry.helpTexts.join('\n')
	})
});

function start() {
	if(ws_retries++ < ws_max_retries) {
		request.getAsync({
			url: "https://slack.com/api/rtm.start",
			qs: {token: conf.rtm_token}
		}).spread(function (response, body) {
			if (response.statusCode == 200) {
				body = JSON.parse(body);
				openWebsocket(body);
				// load the plugins
				pluginRegistry.respond(
					new RegExp("help$",'im'),
					slackbotHelp
				);
				conf.plugins.forEach(function(name) {
					const plugin = require('./plugins/'+name);
					const status = plugin.load(pluginRegistry);
				});
			} else {
				// try again
				console.log("retrying in " + (ws_retries * 5000) / 1000 + " seconds");
				setTimeout(start, ws_retries * 5000)
			}
		});
	}
}

// ALL SYSTEMS GO!
start();
