/** @module search */
const Promise = require('bluebird');
const _       = require('lodash');
const request = Promise.promisifyAll(require('request'));
const config = require('./search_config.json');

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
  //var userText = "<@"+slack.hook.user_id+"|"+slack.hook.user_name+">";
  //var searchURL = 'https://ajax.googleapis.com/ajax/services/search/web';
	var searchURL = 'https://www.googleapis.com/customsearch/v1';
  var site = data.matches[1];
  var query = data.matches[2];
  var siteUrl = getSiteUrl(site);
	var qs = {
		"cx": config.searchId,
			"key": config.apikey,
			"v": "1.0",
			"safe": "high",
			"filter": "1",
			"fields": "items(displayLink,fileFormat,formattedUrl,htmlFormattedUrl,htmlSnippet,htmlTitle,kind,link,mime,snippet,title)",
			"num": 5,
			"q": query
	};
	if(siteUrl) {
		qs.siteSearch = siteUrl
	}
  return request.getAsync({
    url: searchURL,
		qs: qs
  })
  .spread(function(response, body){
    if(response.statusCode==200) {
		  var results = JSON.parse(body);
		  if(results.items != null && !!results.items.length) {
				var items = results.items;
        var resultUrl = items[0].link;
        var resultTitle = items[0].title;
				var resultSnippet = items[0].snippet.replace('\n',' ');
        var resultMore = 'https://google.com/search?q='+query;
        bot.sendMessage({
					username: "Search Results",
					icon_emoji: ":mag_right:",
					text: [
						"<"+resultUrl+"|"+resultTitle+">",
						resultSnippet,
						"<"+resultMore+"|See More Results\u2026>"
					].join('\n')
				});
		  }
    }
  });
});

exports.load = function(registry) {
  var helpText = 'Perform a search';
  registry.register(
    //plugin name
    'google search',
    // trigger regex
    new RegExp("^[`!](g|google) (.*?)$",'im'),
    // function to run
    search,
    // help text
    helpText
  );
  // register the other search triggers
  sites.forEach(function(s) {
    registry.register(
      //plugin name
      s[0]+' search',
      // trigger regex
      new RegExp("^[`!]("+s[0]+") (.*?)$",'im'),
      // function to run
      search,
      // help text
      helpText
    );
  });
  return true;
}
