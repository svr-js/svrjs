function nameObj(n, v) {
	return {name:n, value:v};
}

function testStart() {
	document.write('<meta charset="UTF-8">');
	document.write('<title>hexstrbase64 base64 test</title>');
	console.log("TESTING STARTED");
	for (var i = 0; i < 3; i++) {
		document.write('<h1>' + enccases[i].name + '</h1>');
		console.log("SWITCH " + enccases[i].name);
		for (var j = 0; j < 2; j++) {
			document.write('<h2>' + enccases[i].value[j].name + '</h2>');
			console.log("CASE " + enccases[i].value[j].name);
			console.log("MUST BE: " + enccases[i].value[j].value);
			console.log("IS : " + hexstrbase64.strtobase64(enccases[i].value[j].name));
			if (hexstrbase64.strtobase64(enccases[i].value[j].name) == enccases[i].value[j].value) {
				document.write('<p><img src="../ok.png"></img>Equals</p>');
				console.log("EQUALS");
			} else {
				document.write('<p><img src="../fail.png"></img>Not Equals</p>');
				console.log("NOT EQUALS");
			}
			console.log("CASE " + enccases[i].value[j].name + " ENDED");
		}
		console.log("SWITCH " + enccases[i].name + " ENDED");
	}
	console.log("TESTING ENDED");
}

var enccases = [
	nameObj('Ascii', [
		nameObj('Hello world!', 'AEgAZQBsAGwAbwAgAHcAbwByAGwAZAAh'),
		nameObj('Lorem ipsum', 'AEwAbwByAGUAbQAgAGkAcABzAHUAbQ==')
	]),
	nameObj('Ascii More Than 64 Bytes', [
		nameObj(
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum fermentum ac nisl a sollicitudin. Cras interdum dui turpis, non scelerisque.',
			'AEwAbwByAGUAbQAgAGkAcABzAHUAbQAgAGQAbwBsAG8AcgAgAHMAaQB0ACAAYQBtAGUAdAAsACAAYwBvAG4AcwBlAGMAdABlAHQAdQByACAAYQBkAGkAcABpAHMAYwBpAG4AZwAgAGUAbABpAHQALgAgAFYAZQBzAHQAaQBiAHUAbAB1AG0AIABmAGUAcgBtAGUAbgB0AHUAbQAgAGEAYwAgAG4AaQBzAGwAIABhACAAcwBvAGwAbABpAGMAaQB0AHUAZABpAG4ALgAgAEMAcgBhAHMAIABpAG4AdABlAHIAZAB1AG0AIABkAHUAaQAgAHQAdQByAHAAaQBzACwAIABuAG8AbgAgAHMAYwBlAGwAZQByAGkAcwBxAHUAZQAu'
		),
		nameObj(
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus dapibus volutpat ligula at pulvinar. Etiam consequat mi fringilla facilisis eleifend.',
			'AEwAbwByAGUAbQAgAGkAcABzAHUAbQAgAGQAbwBsAG8AcgAgAHMAaQB0ACAAYQBtAGUAdAAsACAAYwBvAG4AcwBlAGMAdABlAHQAdQByACAAYQBkAGkAcABpAHMAYwBpAG4AZwAgAGUAbABpAHQALgAgAFAAaABhAHMAZQBsAGwAdQBzACAAZABhAHAAaQBiAHUAcwAgAHYAbwBsAHUAdABwAGEAdAAgAGwAaQBnAHUAbABhACAAYQB0ACAAcAB1AGwAdgBpAG4AYQByAC4AIABFAHQAaQBhAG0AIABjAG8AbgBzAGUAcQB1AGEAdAAgAG0AaQAgAGYAcgBpAG4AZwBpAGwAbABhACAAZgBhAGMAaQBsAGkAcwBpAHMAIABlAGwAZQBpAGYAZQBuAGQALg=='
		)
	]),
	nameObj('Unicode UTF8', [
		nameObj(
			'DorianTech Hex String Base64转换器',
			'AEQAbwByAGkAYQBuAFQAZQBjAGgAIABIAGUAeAAgAFMAdAByAGkAbgBnACAAQgBhAHMAZQA2ADSPbGNiVmg====='
		),
		nameObj(
			'DorianTech Hex String Base64转换器，用于由DorianTech提供的Node.js',
			'AEQAbwByAGkAYQBuAFQAZQBjAGgAIABIAGUAeAAgAFMAdAByAGkAbgBnACAAQgBhAHMAZQA2ADSPbGNiVmj/DHUoTo51MQBEAG8AcgBpAGEAbgBUAGUAYwBoY9BPm3aEAE4AbwBkAGUALgBqAHM====='
		)
	])
];