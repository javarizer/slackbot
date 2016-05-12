/**
 * @module flip
 */
"use strict";
const Promise = require('bluebird');
const chars = {
    'a' : '\u0250',
    'b' : 'q',
    'c' : '\u0254',
    'd' : 'p',
    'e' : '\u01DD',
    'f' : '\u025F',
    'g' : 'b',
    'h' : '\u0265',
    'i' : '\u0131',
    'j' : '\u027E',
    'k' : '\u029E',
    'l' : '\u05DF',
    'm' : '\u026F',
    'n' : 'u',
    'o' : 'o',
    'p' : 'd',
    'q' : 'b',
    'r' : '\u0279',
    's' : 's',
    't' : '\u0287',
    'u' : 'n',
    'v' : '\u028C',
    'w' : '\u028D',
    'x' : 'x',
    'y' : '\u028E',
    'z' : 'z',
    '[' : ']',
    ']' : '[',
    '(' : ')',
    ')' : '(',
    '{' : '}',
    '}' : '{',
    '?' : '\u00BF',
    '\u00BF' : '?',
    '!' : '\u00A1',
    "\'" : ',',
    ',' : "\'",
    '.' : '\u02D9',
    '_' : '\u203E',
    ';' : '\u061B',
    '9' : '6',
    '6' : '9',
    '\u2234' : '\u2235',
    '>' : '<',
    '<' : '>',
    '/' : '\\',
    '\\' : '/'
}

var flip = Promise.method(function(data, userData, bot) {
    var text = data.matches[1];
    var flippedText = '(╯°□°）╯︵ ' + text.toLowerCase().split('').map(function(c) {
            return chars[c] ? chars[c] : c;
    }).reverse().join('');

    // Return from the Promise
    bot.sendMessage({
        text: flippedText,
        username: userData.user.real_name,
        icon_url: userData.user.profile.image_48
    });
});

exports.load = function(registry) {
    var helpText = 'Flip some text!!!';
    registry.register(
        'flip',                 //plugin name
        /^[`!]flip[\s]+?([^]*?)$/im,  // trigger regex
        flip,                 // function to run
        helpText                 // help text
    );
    return true;
}
