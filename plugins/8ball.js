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
	"are", "aren't",
	"can", "can't",
	"have", "haven't",
	"will", "won't",
	"do", "don't",
	"did", "didn't",
	"should", "shouldn't",
	"would", "wouldn't"
]

var fortune = Promise.method(function(data, userData, bot) {
	bot.sendMessage({
		username: "Magic 8Ball",
		icon_url: "http://asphyxia.com/8ball.png",
		text: answers[Math.floor(answers.length*Math.random())]
	});
});

exports.load = function(registry) {
	var helpText = 'Ask me a yes/no question.';
	registry.register(
		'8Ball',                 //plugin name
		new RegExp("^[`!](" + keywords.join('|') + ")[^?]+[?]$",'im'),  // trigger regex
		fortune,                 // function to run
		helpText                 // help text
	);
	return true;
}
