/** @module search */
const Promise = require('bluebird');
const _       = require('lodash');
const request = Promise.promisifyAll(require('request'));
const config = require('./search_config.json');
const google = require('google');

const sites = [
    [ "mdn",     "developer.mozilla.org " ]
  , [ "wiki",    "en.wikipedia.org " ]
  , [ "imdb",    "www.imdb.com " ]
  , [ "reddit",  "www.reddit.com " ]
  , [ "hn",      "news.ycombinator.com " ]
  , [ "youtube", "www.youtube.com " ]
  , [ "espn",    "espn.go.com " ]
]

function getSiteUrl(siteName) {
  for(var i=sites.length; i-- > 0; ) {
    if(sites[i][0] == siteName) {
      return sites[i][1] ;
    }
  }
  return false
}

var search = Promise.method(function(data, userData, bot) {
  var site = data.matches[1];
  var query = data.matches[2];
  var siteUrl = getSiteUrl(site);

	if(siteUrl) {
		query = `site:${siteUrl} ${query}`
	}

	google(query, (err, res) => {
		if(err) {
			return false;
		}
		if(res.links.length) {
			let result = res.links[0];
			bot.sendMessage({
				username: "Search Results",
				icon_emoji: ":mag_right:",
				text: [
					"<"+result.link+"|"+result.title+">",
					result.description.replace(/\n/g, ' '),
					"<"+res.url+"|See More Results\u2026>"
				].join('\n')
			});
		}
		res.links.forEach((link) => {

		});
		return true;
	});
});

var helpText = `
*NAME*
Google Search - Searches google for your phrase and returns the first result.
`;
var help = Promise.method(function(data, userData, bot) {
	bot.sendMessage({text: helpText})
});

exports.load = function(registry) {
  registry.respond(
		new RegExp("(g|google) (.*?)$",'im'),
		search
	);
  // register the other search triggers
  sites.forEach(function(s) {
    registry.respond(
			new RegExp("("+s[0]+") (.*?)$",'im'),
			search
		);
  });

	registry.help('Google Search - Searches google for your phrase and returns the first result. `search help` for more.');
	registry.hear(/^search help$/, help);
	return true;

};
