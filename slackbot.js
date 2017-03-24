/**
Slack Webhook Handler
*/
"use strict";
//const request = require('request');
const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const WebClient = require('@slack/client').WebClient;
//const WebSocket = require('ws');
const _ = require('lodash');
const Promise = require('bluebird');
//const request = Promise.promisifyAll(require("request"));

let _self;
let ws;
let messageID = 0;
let ws_retries = 0;
let ws_max_retries = 5;
// SET UP SLACK
const conf = require(process.env.CONFIG || "./config.json");
const web = new WebClient(conf.api_token);

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
		// console.log("==================");
		// console.log("Registering plugin");
		// console.log(name, regex);
		//SlackBot().sendDirectMessage(conf.admin_id, {text:`Registered: \`${name}\` using \`\`\`${regex.source}\`\`\``});
	},
	hear: (regex, func) => {
		pluginRegistry.commands[regex.source]= {
			r: regex, // the regex to parse
			f: func   // the function to run
		};
		// console.log("==================");
		// console.log("Listening for");
		// console.log(regex.source);
		//SlackBot().sendDirectMessage(conf.admin_id, {text:`Listening: \`\`\`${regex.source}\`\`\``});
	},
	respond: (regex, func) => {
		// merge the triggers for the regex
		pluginRegistry.commands[regex.source]= {
			r: new RegExp(
				"^(?:["+conf.triggers+"]|"+conf.username+"|<@"+_self+">)[,:]?\\s*?"+regex.source,
				_.union(regex.flags ? regex.flags.split('') : '',['i','m']).join('')),
			f: func
		};
		// console.log("==================");
		// console.log("Responding to");
		// console.log(pluginRegistry.commands[regex.source].r.source);
		//SlackBot().sendDirectMessage(conf.admin_id, {text:`Responding: \`\`\`${pluginRegistry.commands[regex.source].r.source}\`\`\``});
	}
};

const _Slack = class _SlackBot {
	constructor(channel) {
		this.self = _self;
		this.config = conf;
		this.channel = channel;
	}
};

var SlackBot = (channel) => {
	return {
		self: _self,
		config: conf,
		help: pluginRegistry.help,
		register: pluginRegistry.register,
		respond: pluginRegistry.respond,
		hear: pluginRegistry.hear,
		getUserData: Promise.method(function (user) {
			return web.users.info(user)
			.then(user => {
				return user;
			});
		}),
		sendDirectMessage: Promise.method((user, message) => {
			let imParams = {
				token: conf.api_token,
				user: user
			};
			return request.getAsync({
				url: "https://slack.com/api/im.open",
				method: "POST",
				qs: imParams
			}).spread(function (response, body) {
				if (response.statusCode == 200) {
					let imData = JSON.parse(body);
					if(imData && imData.channel && imData.channel.id) {
						return SlackBot(imData.channel.id).sendMessage(message)
					}
				}
			}).error((e) => {
				console.log(e)
			});
		}),
		sendMessage: Promise.method(message => {
			let options = _.merge(
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
			return web.chat.postMessage(channel, message.text, options);
		}),
		updateMessage: Promise.method(function (message) {
			let options = _.merge(
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
			return web.chat.update(message.ts, channel, message.text, options);
		})
	}
};

var slackbotHelp = Promise.method(function(data, userData, bot) {
	bot.sendMessage({
		text: pluginRegistry.helpTexts.join('\n')
	})
});

function start() {

	let processCommands = (bot, data) => {
		if (data.text) {
			_.forOwn(pluginRegistry.commands, function (command, name) {
				if (command.r.test(data.text)) {
					let commandData = Object.assign({}, data);
					commandData.matches = command.r.exec(data.text);
					bot.getUserData(data.user)
					.then(function (userData) {
						command.f(commandData, userData, bot)
					})
					.catch(function (e) {
						console.log(e);
					});
				}
			});
		}
	};

	let rtm = new RtmClient(
		conf.rtm_token,
		{
			logLevel: conf.logLevel,
			autoReconnect: true
		}
	);
	rtm.start();

	rtm.on(CLIENT_EVENTS.RTM.WS_OPENING, function handleConnecting() {
		console.log('WS_OPENING');
	});

	rtm.on(CLIENT_EVENTS.RTM.WS_OPENED, function handleConnecting() {
		console.log('WS_OPENED');
	});

	rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function handleConnecting(data) {
		console.log('AUTHENTICATED');
		_self = data.self.id;
		let bot = SlackBot();
		// register the help command
		pluginRegistry.respond(
			new RegExp("help$",'im'),
			slackbotHelp
		);
		conf.plugins.forEach(function(name) {
			require('./plugins/'+name).load(bot);
		});
	});

	rtm.on(CLIENT_EVENTS.RTM.ATTEMPTING_RECONNECT, function handleConnecting(data) {
		console.log('ATTEMPTING_RECONNECT');
	});

	rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
		if (message.type == "message" && !message.subtype) {
			let bot = SlackBot(message.channel);
			processCommands(bot, message);
		}
	});
}

// ALL SYSTEMS GO!
start();
