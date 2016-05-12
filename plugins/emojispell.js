const Promise = require('bluebird');
const _ = require('lodash');
const letters = {
	'!': ['exclamation','heavy_exclamation_mark','grey_exclamation'],
	'?': ['question','grey_question'],
	'-': ['heavy_minus_sign'],
	'+': ['heavy_plus_sign'],
	0: ['zero'],
	1: ['one'],
	2: ['two'],
	3: ['three'],
	4: ['four'],
	5: ['five'],
	6: ['six'],
	7: ['seven'],
	8: ['eight'],
	9: ['nine'],
	a: ['mlb_ari','mlb_atl','mlb_laa','mlb_oak','ncaa_alcn','ncaa_app','ncaa_ariz','ncaa_army','ncaah_uaf'],
	b: ['mlb_bos','nba_bkn','ncaa_brad','ncaah_bent','nfl_cin','nhl_bos'],
	c: ['mlb_chc','mlb_cin','mlb_cle','ncaa_camp','ncaa_chat','ncaa_cin','ncaa_cmu','ncaa_cofc','ncaa_colg','nfl_chi','nhl_cgy','nhl_mtl'],
	d: ['mlb_det','ncaa_dart','ncaa_day','ncaa_duke','ncaaw_denison','nhl_ana'],
	e: ['ncaa_emu','ncaa_etsu'],
	f: ['ncaa_csf','facebook'],
	g: ['ncaa_gram','ncaa_gtwn','ncaa_uga','nfl_gb'],
	h: ['ncaa_harv','ncaa_haw'],
	i: ['ncaa_idho','ncaa_ill'],
	j: ['crescent_moon','heavy_check_mark','arrow_heading_up','nol_suns','nol_jackhammers'],
	k: ['ncaa_kent'],
	l: ['ncaa_l-il','ncaa_l-md','ncaa_leh','ncaa_lip'],
	m: ['mlb_mia','mlb_mil','ncaa_m-oh','ncaa_man','ncaa_md','ncaa_mer','ncaa_mem','ncaa_mich','ncaa_minn','ncaa_mrsh','ncaa_msst','ncaa_murr'],
	n: ['ncaa_navy','ncaa_ne','ncaa_neb','ncaa_nich','ncaa_nw'],
	o: ['ncaa_ore','ncaa_osu','ncaa_unom','opera'],
	p: ['mlb_phi','mlb_pit','nba_det','nba_ind','ncaa_pepp','ncaa_port','ncaa_prin','ncaa_pur','nhl_phi'],
	q: ['rice_cracker'],
	r: ['nba_hou','ncaa_rice','ncaa_rid','ncaa_rutg'],
	s: ['mlb_sea','ncaa_ncst','ncaa_sac','ncaa_scst','ncaa_stan','ncaa_syr','heavy_dollar_sign'],
	t: ['mlb_tex','ncaa_tem','ncaa_tenn','ncaa_ttu','ncaa_tuln'],
	u: ['ncaa_mia','ncaa_upst','ncaa_utah','ncaah_union','nfl_ind'],
	v: ['ncaa_nova','ncaa_uva','ncaa_uvm'],
	w: ['mlb_wsh','ncaa_wash','ncaa_wis','ncaa_wof','nhl_wsh'],
	x: ['ncaa_xav','xgames','skull_and_crossbones','heavy_multiplication_x'],
	y: ['ncaa_byu','ncaa_yale','ncaa_ysu'],
	z: ['ncaa_akr']
};

var spell = Promise.method(function(data, userData, bot) {
	var input = data.matches[1].trim().split('');
	var output = "";
	_.forEach(input, function(letter) {
		var l = letter.toLowerCase();
		output += letters[l] ? ":"+letters[l][Math.floor(letters[l].length*Math.random())]+":" : letter;
	});
	bot.sendMessage({
		username: "Emojized",
		text: output.replace(/\s/gi,new Array(5).join(' '))
	});
});

exports.load = function(registry) {
	var helpText = 'Ask me a yes/no question.';
	registry.register(
		'emoji spell',                 //plugin name
		new RegExp("^[`!]spell[\s]*?([^]*?)$",'im'),  // trigger regex
		spell,                 // function to run
		'spell words with emojis'                 // help text
	);
	return true;
}
