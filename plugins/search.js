/** @module search */
const Promise = require('bluebird');
const _       = require('lodash');
const request = Promise.promisifyAll(require('request'));

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

var search = Promise.method(function(data, userData) {
  //var userText = "<@"+slack.hook.user_id+"|"+slack.hook.user_name+">";
  var searchURL = 'https://ajax.googleapis.com/ajax/services/search/web';
  var site = data.matches[1];
  var query = data.matches[2];
  var siteUrl = getSiteUrl(site);
  if(siteUrl) {
    query = 'site:'+siteUrl+query
  }

  return request.getAsync({
    url: searchURL,
    qs: {
      "v": "1.0",
      "q": query
    }
  })
  .spread(function(response, body){
    if(response.statusCode==200) {
		  var results = JSON.parse(body);
		  if(results.responseData != null && !!results.responseData.results.length) {
        var resultUrl = results.responseData.results[0].unescapedUrl;
        var resultTitle = results.responseData.results[0].titleNoFormatting;
        var resultMore = results.responseData.cursor.moreResultsUrl;
        return {
					username: "Search Results",
					icon_emoji: ":mag_right:",
					text: [
						"<"+resultUrl+"|"+resultTitle+">",
						"<"+resultMore+"|See More Results\u2026>"
					].join('\n')
				}
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
