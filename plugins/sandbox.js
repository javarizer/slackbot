const Promise = require('bluebird');
var Sandbox = require('sandbox')
  , s = new Sandbox()
	, html = require('html-escaper');

var run = Promise.method(function(data, userData) {
	var code = html.unescape(data.matches[3]);
	return new Promise(function(resolve,reject) {
		s.run(code, function(output) {
			resolve({ text: "```"+output.result+"```" })
		});
	});
});

exports.load = function(registry) {
	var helpText = 'paste me some code.';
	registry.register(
		// NAME
		'sandbox',
		// TRIGGER
		/```([\s\n]*?\/\/[\s]*?(js|javascript))([^]*?)```/im,
		// METHOD
		run,
		// HELPT TEXT
		helpText
	);
	return true;
}
