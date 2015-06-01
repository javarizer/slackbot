/** @module jira */
const Promise = require('bluebird')
const _       = require('lodash');
const request = Promise.promisifyAll(require("request"));

var jokes = Promise.method(function(data, userData) {
  var URL = 'http://api.icndb.com/jokes/random';
  return request.getAsync({
    url: URL,
    qs: {
    	escape: 'javascript',
    	limitTo: '[nerdy]'
    }
  }).spread(function(response, body){
 		if(response.statusCode==200) {
			var results = JSON.parse(body);
			if(results != null && results.type == "success") {
				return {
					username: "Chuck Norris",
					icon_url: "http://www.bf4-emblems.com/wp-content/uploads/2013/11/Chuck-Norris.jpg",
					text: results.value.joke
				}
			}
		}
  });
});

exports.load = function(registry) {
	registry.register(
		// name
		'Chuck Norris Jokes',
		// trigger
		new RegExp("^[`!](j|joke|chuck|norris|wwcnd|wwcd)$",'im'),
		// command
		jokes,
		// help text
		'Returns a Chuck Norris joke.'
	);
	return true;
}
