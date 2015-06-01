const Promise = require('bluebird');
var YQL = require('yql');
var _   = require('lodash');

var forecast = Promise.method(function(data, userData) {
	var query = new YQL('select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="'+data.matches[2]+'")');
	query = Promise.promisifyAll(query)
	
	return query.execAsync().then(function(data) {
	  var location = data.query.results.channel.location;
	  var condition = data.query.results.channel.item.condition;
	  var forecast = data.query.results.channel.item.forecast;
	  var forecastFields = [];
	  _.each(forecast, function(f) {
	  	forecastFields.push({
	  		"title": f.day,
	  		"value": f.text+"\n*"+f.high+"\u00B0* "+f.low+"\u00B0",
	  		"short": true
	  	})
	  });
	  var locationTitle = location.city + ', ' + (!!(location.region.length) ? location.region : location.country);
	  return {
			username: "Current Conditions",
			icon_url: "http://asphyxia.com/weather/png/"+condition.code+".png",
			text: [
				'*'+locationTitle+'*\n',
				condition.text,
				condition.temp+'\u00B0'
			].join(' ')/*,
			attachments: [
				{
					fallback: "Forecast for "+locationTitle,
					pretext: "Forecast for "+locationTitle,
					fields: forecastFields,
					mrkdwn: true,
					mrkdwn_in: ["fields"]
				}
			]
			*/
		};
	});
});

exports.load = function(registry) {
	var helpText = "Grab the current weather";
	registry.register(
		'weather',                                  //plugin name
		/^[`!](w|weather) (.*)$/im, // trigger regex
		forecast,                                      // function to run
		helpText                                    // help text
	);
	return true;
}