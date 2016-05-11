const Promise = require('bluebird')

var greet = Promise.method(function(data, userData, bot) {
	if(userData && userData.user) {
		var user_id = userData.user.id || '';
		var user_name = userData.user.profile.real_name_normalized || '';
		var greeting = data.matches[0].charAt(0).toUpperCase()
		greeting += data.matches[0].substr(1)
		greeting += " <@{id}>"
			.replace("{id}", user_id || '')
			.replace("{name}", user_name || '');

		return {text: greeting}
	}
})

exports.load = function(registry) {
	var helpText = null;
	registry.register(
		'greeter',                                  //plugin name
		/^(aloha|hello|hi|howdy|hey|greetings|sup|hola)$/im, // trigger regex
		greet,                                      // function to run
		helpText                                    // help text
	);
	return true;
}
