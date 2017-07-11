/** @module responder */
'use strict';
const Promise = require('bluebird');
const _       = require('lodash');
const listeners = [
	{
		trigger: /\b(?:srsly|gui[sz]e)\b/,
		response: "http://66.media.tumblr.com/2ef6d723c5b06fc7a25f6a32bb7ddeb0/tumblr_mpdnikiHrl1r9n3cmo1_400.gif"
	},
	{
		trigger: /release the kraken/,
		response: "https://asphyxia.com/i/release-the-wee-kraken.jpg"
	},
	{
		trigger: /automagic(?:aly)?/i,
		response: ":wizard_hat:  Automagically\t\t\t\t\t:buggy:\n:j_c2: /\n:shirt::magic_wand:\n:jeans:"
	}
];

var responder = Promise.method(function(data, userData, bot) {
	_.forEach(listeners, l => {
		if(l.trigger.test(data.text)) {
			bot.sendMessage({ text: l.response })
		}
	});
	return true
});

var helpFull = Promise.method(function(data, userData, bot) {
	var attachments = [];
	_.forOwn(listeners, function(listener) {
		attachments.push(
			{
				fallback: `${listener.trigger.toString()}\n\t${listener.response}`,
				mrkdwn_in: ['fields'],
				fields: [
					{title: listener.trigger.toString()},
					{value: listener.response}
				]
			}
		);
	});
	bot.sendMessage({
		username: 'Responder Help',
		text: "The responder bot listens for specific triggers in text and responds accordingly.",
		attachments: attachments
	});
});

exports.load = function(registry) {
	registry.hear(new RegExp(".*?",'im'), responder);
	registry.hear(/^responder help$/, helpFull);
	return true;
};
