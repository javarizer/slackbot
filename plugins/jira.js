/** @module jira */

const Promise = require('bluebird');
const _       = require('lodash');
const request = Promise.promisifyAll(require('request'));
const config  = require("./jira_config.json");
const unames  = require("./jira_usernames.json");
const fs      = require('fs');

// set up the cookie jar for request
var jira_jar = request.jar();
var defaultDomain = null;
_.forOwn(config, function(settings,domain) {
	if(settings["default"]) {
		defaultDomain = domain;
	}
});

function trimText(input) {
	if(input != null) {
		var out = input.substr(0,300);
		out = out.substr(0,Math.min(300,out.lastIndexOf(' '))).trim();
		if(out.length < input.length) { out+='\u2026'; }
		return out;
	} else {
		return '';
	}
}

var login = Promise.method(function(domain) {
	return request.getAsync({
		jar: jira_jar,
		url: 'https://'+domain+'/login.jsp',
		method: 'POST',
		qs: {
			os_username: config[domain].username,
			os_password: config[domain].password,
			os_cookie: true,
			os_destination: '',
			atl_token: '',
			login: 'Log In'
		}
	}).catch(function(e) {
		console.log(e);
		Promise.reject();
	})
});

var searchJira = Promise.method(function(data,userData,bot) {
	var searchText = _.unescape(data.matches[1])
	var apiURL = 'https://'+defaultDomain+'/rest/api/2/search';
	return login(defaultDomain)
	.spread(function(response, body){
		return request.getAsync({
			jar: jira_jar,
			url: apiURL,
			method: 'POST',
			qs: {
				jql: searchText
			},
			headers: { 'Content-Type': 'application/json' }
		})
	})
	.spread(function(response,body){
		try {
			var json = JSON.parse(body);
			if(json.errorMessages) {
				_.each(json.errorMessages, function(e){
					console.error(e)
				});
				return false;
			} else {
				if(json.issues.length == 1) {
					var results = processTicketApiResponse(defaultDomain, response, JSON.stringify(json.issues[0]))
					if(results) {
						bot.sendMessage(results);
					}
				} else {
					var searchResults=[];
					_.each(json.issues, function(issue) {
						searchResults.push(issue.key+": <https://"+defaultDomain+"/browse/"+issue.key+"|"+issue.fields.summary+">");
					});
					bot.sendMessage({
						icon_url: "https://"+defaultDomain+"/images/64jira.png",
						text: searchResults.join('\n')
					});
				}
			}
		} catch(e) {
			console.log('Jira plugin', e);
			return false
		}
	})
	.error(function(e) {
		console.log(e)
	});
});

var getJiraTicket = Promise.method(function(data, userData, bot) {
	var page   = data.matches[0];
	var domain = data.matches[1];
	var ticket = data.matches[2];
	var ticketURL = 'https://'+domain+'/rest/api/2/issue/'+ticket;
	return login(domain)
	.spread(function(response, body){
		return loadJiraTicket(ticketURL)
	})
	.spread(function(response, body){
		var results = processTicketApiResponse(domain, response, body);
		if(results) {
			bot.sendMessage(results)
		}
	});
});

var loadJiraTicket = Promise.method(function(ticketURL) {
	return request.getAsync({
		jar: jira_jar,
		url: ticketURL,
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	})
});

var createJiraDialog = Promise.method(function(data, userData) {

});

var createJira = Promise.method(function(data, userData, bot) {
	var key         = data.matches[1];
	var summary     = data.matches[2];
	var description = data.matches[3];
	var reporter    = unames[userData.user.id] || "jiraanonymous";
	// customfield_10008 == Story Points
	var payload = {
		"fields": {
			"reporter": { "name": reporter },
			"project":
			{
				"key": key.toUpperCase()
			},
			"summary": summary.split('=')[1],
			"description": description.split('=')[1],
			"issuetype": {
				"name": "Story"
			}
		}
	};
	return login(defaultDomain)
	.spread(function(response, body) {
		return request.postAsync({
			jar: jira_jar,
			url: 'https://'+defaultDomain+'/rest/api/2/issue/',
			method: 'POST',
			body: payload,
			json: true
		})
	})
	.spread(function(response, body){
		var ticket = body;
		var ticketURL = 'https://'+defaultDomain+'/rest/api/2/issue/'+ticket.key;
		return loadJiraTicket(ticketURL)
	})
	.spread(function(response, body){
		var results = processTicketApiResponse(defaultDomain, response, body);
		if(results) {
			bot.sendMessage(results)
		}
	});
});

var registerSlackName =Promise.method(function(data, userData, bot) {
	var jira_username = data.matches[1];
	unames[userData.user.id] = jira_username;
	fs.writeFileSync(__dirname+"/jira_usernames.json", JSON.stringify(unames));
	bot.sendMessage({
		text: "Your usernames have been linked."
	});
});

// process the jira api response
function processTicketApiResponse(domain, response, body) {
	try {
		var json = JSON.parse(body);
		if(json.errorMessages) {
			_.each(json.errorMessages, function(e){ console.log(e) })
		} else {
			var f = json.fields;
			return {
				icon_url: "https://"+domain+"/images/64jira.png",
				text: json.key+": <https://"+domain+"/browse/"+json.key+"|"+f.summary+">",
				attachments: [{
					fallback: trimText(f.description),
					pretext: trimText(f.description),
					color: (f.status.name=='Closed'||f.status.name=='Resolved') ? "good":"warning",
					fields: [
					{	title: "Assignee",
						value: (f.assignee?f.assignee.displayName:"N/A"),
						short: true
					},
					{	title: "Priority",
						value: (f.priority?f.priority.name:"N/A"),
						short: true
					}
					]
				}]
			};
		}
	} catch(e) {
		console.log('Jira plugin', e, body);
		return false;
	}
}

exports.load = function(registry) {
	var helpText = 'Grab details about a jira ticket';
	registry.register(
		//plugin name
		'jira-ticket',
		// trigger regex
		new RegExp("[^ <]*("+_.keys(config).join('|')+").+?\/([^ >]+)",'im'),
		// function to run
		getJiraTicket,
		// help text
		helpText
	);

	// search jira via jql
	registry.register(
		//plugin name
		'jira-search',
		// trigger regex
		/^[`!]jira search[\s]+?([^]*?)$/im,
		// function to run
		searchJira,
		// help text
		helpText
	);

	// search jira via jql
	registry.register(
		//plugin name
		'jira-create',
		// trigger regex
		/^[`!]jira create[\s]+?([^]*?)[\s]+(summary=[^]*?)[\s]+(description=[^]*?)$/im,
		// function to run
		createJira,
		// help text
		'Create a JIRA ticket'
	);

	// assign your slack name to a jira name
	registry.register(
		'jira-register',
		/^[`!]jira register[\s]+?([^]*?)$/im,
		registerSlackName,
		'Register your Jira username'
	);

	// search jira via jql
	registry.register(
		//plugin name
		'jira-create-dialog',
		// trigger regex
		/^[`!]jira create$/im,
		// function to run
		createJiraDialog,
		// help text
		'Create a JIRA Dialog'
	);
};
