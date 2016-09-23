/**
	Magic 8Ball
*/
const Promise = require('bluebird');
const answers = [
"It is certain",
"It is decidedly so",
"Without a doubt",
"Yes definitely",
"You may rely on it",
"As I see it, yes",
"Most likely",
"Outlook good",
"Yes",
"Signs point to yes",
"Reply hazy try again",
"Ask again later",
"Better not tell you now",
"Cannot predict now",
"Concentrate and ask again",
"Don't count on it",
"My reply is no",
"My sources say no",
"Outlook not so good",
"Very doubtful"
];

// words that can trigger the yes/no question logic
const keywords = [
	"is", "isn't",
	"was", "were",
	"am", "are", "aren't",
	"can", "can't",
	"have", "haven't",
	"will", "won't",
	"do", "don't",
	"did", "didn't",
	"should", "shouldn't",
	"would", "wouldn't"
];

var fortune = Promise.method(function(data, userData, bot) {
	bot.sendMessage({
		username: "Magic 8Ball",
		icon_url: "http://asphyxia.com/8ball.png",
		text: answers[Math.floor(answers.length*Math.random())]
	});
});

var helpText = `
*NAME*
	8ball - Ask the Magic 8Ball a yes/no question

*DESCRIPTION*
	The Magic 8Ball will answer any yes/no question it is asked that is preceeded by the bot's trigger phrase and ends in a question mark.
`;
var help = Promise.method(function(data, userData, bot) {
	bot.sendMessage({text: helpText})
});

exports.load = function(registry) {
	registry.respond(
		new RegExp("(" + keywords.join('|') + ")[^?]+[?]$",'im'),
		fortune
	);

	registry.help('Magic 8ball - Ask the Magic 8Ball a yes/no question. `8ball help` for details.');
	registry.hear(/^8ball help$/, help);
	return true;
};
