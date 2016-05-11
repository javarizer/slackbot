/** @module responder */
'use strict';
const Promise = require('bluebird');
const _       = require('lodash');

const listeners = [
	{
		trigger: /srsly|gui[sz]e/,
		response: "http://66.media.tumblr.com/2ef6d723c5b06fc7a25f6a32bb7ddeb0/tumblr_mpdnikiHrl1r9n3cmo1_400.gif"
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

exports.load = function(registry) {
	registry.register(
		//plugin name
		'responder',
		// trigger regex
		/.*/im,
		// function to run
		responder,
		//()=>{ return respond('http://66.media.tumblr.com/2ef6d723c5b06fc7a25f6a32bb7ddeb0/tumblr_mpdnikiHrl1r9n3cmo1_400.gif') },
		// help text
		'srsly guise'
	);
	return true;
}
