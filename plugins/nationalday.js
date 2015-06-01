/** @module search */
const Promise = require('bluebird');
const _       = require('lodash');
const request = Promise.promisifyAll(require('request'));
const moment  = require('moment');
const parseFormat = require('moment-parseformat');
const cheerio = require('cheerio');

var daysStorage = {};

function returnMessage(out) {
	return {
		username: "National Calendar Day",
		icon_emoji: ":calendar:",
		text: out
	}
}

var resetData = Promise.method(function(data, userData, SlackBot) {
	daysStorage = {};
	return returnMessage('Data Reset');
});

var celebrate = Promise.method(function(data, userData, SlackBot) {
	var dateString = data.matches[1];
	if(dateString == null) {
		dateString = 'yyyy-MM-dd'
	}
	dateString = dateString.trim();
	var format = parseFormat(dateString);
	var date = moment(dateString, format);
	if(date.isValid()) {
		var month = date.format('MMMM').toLowerCase();
		var day = date.format('D');
		return loadMonth(month).then(function (monthData) {
			var out = monthData[day] ? monthData[day] : "No data for " + date.format('MMMM D');
			return returnMessage(out)
		});
	} else {
		return returnMessage('Invalid Date');
	}
});

var loadMonth = Promise.method(function(month) {
	if(daysStorage[month]) {
		return daysStorage[month]
	} else {
		daysStorage[month] = {};
		return request.getAsync({
			url: "http://www.nationaldaycalendar.com/"+month+"/"
		}).spread(function(response, body) {
			console.log('Storing data for %s', month);
			if(response.statusCode==200) {
				var $ = cheerio.load(
					body,
					{
						ignoreWhitespace: false,
						xmlMode: false,
						lowerCaseTags: false
					}
				);
				var entries = $('div.et_pb_blurb_container');
				_.forEach(entries, function(entry) {
					var day = $(entry).find('h4').text().replace(/[^0-9]+/gi,'').trim();
					var lists = $(entry).find('ul > li');
					var outputText = [];
					_.forEach(lists, function(list) {
						var link = $(list).find('a');
						var linkText = link.text();
						var linkHref = link.attr('href');
						outputText.push("<"+linkHref+"|"+linkText+">")
					});
					daysStorage[month][day] = outputText.join('\n')
				});
				return daysStorage[month]
			}

		});
	}
});

exports.load = function(registry) {
	var helpText = 'Celebrate Every Day';

	registry.register(
		//plugin name
		'nationaldaycalendar reset',
		// trigger regex
		/^[`!](?:nationalday|nd) reset$/im,
		// function to run
		resetData,
		// help text
		helpText
	);

	registry.register(
		//plugin name
		'nationaldaycalendar search',
		// trigger regex
		/^[`!](?:nationalday|nd)(?![\s]*?reset)[\s]*?([^]*?)?$/im,
		// function to run
		celebrate,
		// help text
		helpText
	);



	return true;
};
