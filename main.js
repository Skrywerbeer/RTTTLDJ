const testString = 
	"HauntHouse: d=4,o=5,b=108: " +
	"2a4, 2e, 2d#, 2b4, 2a4, 2c, 2d," +
	" 2a#4, 2e., e, 1f4, 1a4, 1d#, 2e.," +
	" d, 2c., b4, 1a4, 1p, 2a4, 2e, 2d#," +
	" 2b4, 2a4, 2c, 2d, 2a#4, 2e., e, 1f4," +
	" 1a4, 1d#, 2e., d, 2c., b4, 1a4";

function playNote(frequency, startTime, duration) {
  if (typeof(frequency) != "number")
	throw new Error("Type error: expected number");
  if (typeof(startTime) != "number")
	throw new Error("Type error: expected number");
  if (typeof(duration) != "number")
	throw new Error("Type error: expected number");
}

function bpmToMsPerBeat(bpm) {
  return (60/bpm)*1000;
}

class NoteLUT {
  #NOTE_LUT;
  constructor() {
	this.NOTE_LUT = [... this.#lutGenerator(88)];
  }
  
  lookupFrequency(note) {
	if (!("letter" in note)  || !("sharp" in note)  || !("octave" in note))
	  throw new Error("Arugument error: expected object with .letter, .sharp and .octave defined");
	if (note.letter == "p")
	  return 0;
	for (const element of this.NOTE_LUT) {
	  if (element.note.letter === note.letter &&
		  element.note.sharp === note.sharp &&
		  element.note.octave === note.octave) {
		return element.frequency;
	  }
	}
	throw new Error(`Could not find ${note.letter}.`);
  }
  
  *#noteGenerator() {
	const notes =
		[
		  {letter: "a", sharp: false},
		  {letter: "a", sharp: true},
		  {letter: "b", sharp: false},
		  {letter: "c", sharp: false},
		  {letter: "c", sharp: true},
		  {letter: "d", sharp: false},
		  {letter: "d", sharp: true},
		  {letter: "e", sharp: false},
		  {letter: "f", sharp: false},
		  {letter: "f", sharp: true},
		  {letter: "g", sharp: false},
		  {letter: "g", sharp: true}
		];
	for (let i = 0, octave = 0; ; i++) {
	  if (i == notes.length) {
		i = 0;
		octave++;
	  }

	  yield {letter: notes[i].letter, sharp: notes[i].sharp, octave: octave}
	}
	return;
  }
  
  *#lutGenerator(count=12) {
	let noteGen = this.#noteGenerator();
	const a0Frequency = 27.5;
	for (let i = 0; i < count; i++) {
	  yield {note: noteGen.next().value, frequency: a0Frequency*Math.pow(2, i/12)};
	}
	return;
  }
}

class RTTTLParser {
  #NoteLUT;
  constructor(parseString) {
	this.parse(parseString);
	this.#NoteLUT = new NoteLUT();
  }
  
  parse(parseString) {
	this.parsedString = parseString;
	this.#parseSections();
	this.#parseDefaultValues();
	this.dataTokenIndex = 0;
  }
  
  *notes() {
	for (const token of this.dataTokens)
	  yield this.parseDataToken(token);
	return;
	
  }
  
  parseDataToken(token) {
	if (!token || typeof(token) != "string")
	  throw new Error(`Argument error: expected string as argument for parseNote. Got: ${token}`);
	const returnData = {};
	returnData.letter = token?.match(/[abcdefgp]/g)?.at(0);
	if (!returnData.letter)
	  throw new Error(`Error parsing: ${token}. Expected one of {a, b, c, d, e, f, g, p}`);
	const digits = token.match(/[0-9]*[0-9]/g) ?? [];
	
	if (!isNaN(token[0])) { // If is a number.
	  returnData.division = Number(digits.length > 0 ? digits[0] : this.defaultDivision);
	  if (digits.length == 2) {
		returnData.octave = Number(digits[1]);
	  }
	  else if (digits.length == 1) {
		returnData.octave = this.defaultOctave;
	  }
	  // digits.length > 2
	  else {
		throw new Error(`Error parsing: ${token}. Expected only two digits.`);
	  }
	}
	else {
	  returnData.division = this.defaultDivision;
	  if (digits.length == 1) {
		returnData.octave = Number(digits[0]);
	  }
	  else if (digits.length == 0) {
		returnData.octave = this.defaultOctave;
	  }
	  else {
		throw new Error(`Error parsing note: ${token}`);
	  }
	}
	returnData.sharp = token.match(/#/g) ? true : false;
	returnData.dotted = token.match(/\./g) ? true : false;
	returnData.frequency = this.#NoteLUT.lookupFrequency(
		{
		  letter: returnData.letter,
		  octave: returnData.octave,
		  sharp: returnData.sharp
		});
	returnData.duration = bpmToMsPerBeat(this.bpm)/returnData.division;
	if (returnData.dotted)
	  returnData.duration *= 1.5;
	return returnData;
  }
  
  #parseSections() {
	let sections = this.parsedString.split(":");
	if (sections.length != 3)
	  throw new Error("Error parsing sections.");
	this.name = sections[0];
	this.defaultValuesTokens = sections[1].split(",");
	this.defaultValuesTokens.forEach((element, index, array) => { array[index] = element.trim(); });
	this.dataTokens = sections[2].split(",");
	this.dataTokens.forEach((element, index, array) => { array[index] = element.trim(); });
	// Some authors use a "," at the end.
	if (this.dataTokens[this.dataTokens.length - 1] == "")
	  this.dataTokens.pop();
  }
  
  #parseDefaultValues() {
	// Use .slice(2) to throw away the *= parts.
	this.defaultDivision = Number(this.defaultValuesTokens[0].slice(2));
	this.defaultOctave = Number(this.defaultValuesTokens[1].slice(2));
	this.bpm = Number(this.defaultValuesTokens[2].slice(2));
  }
}
let lut = new NoteLUT();

let p = new RTTTLParser(testString);
// for (const token of p.dataTokens) {
//   const parse = p.parseDataToken(token);
// 
//   console.log(token);
//   console.log({input: token, output: parse});
// }

let ctx = new AudioContext();

document.querySelector("textarea").value = 
	// "Indiana:d=4,o=5,b=80:" +
	// "e,8p,8f,8g,8p,1c6,8p.,d," +
	// "8p,8e,1f,p.,g,8p,8a,8b,8p," +
	// "1f6,p,a,8p,8b,2c6,2d6,2e6," +
	// "e,8p,8f,8g,8p,1c6,p,d6,8p," +
	// "8e6,1f.6,g,8p,8g,e.6,8p,d6," +
	// "8p,8g,e.6,8p,d6,8p,8g,f.6,8p," +
	// "e6,8p,8d6,2c6";
	"Greensleaves:d=4,o=5,b=80:" +
	"g,2a#,c6,d.6,8d#6,d6,2c6,a," +
	"f.,8g,a,2a#,g,g.,8f,g,2a,f," +
	"2d,g,2a#,c6,d.6,8e6,d6,2c6," +
	"a,f.,8g,a,a#.,8a,g,f#.,8e,f#,2g";

if (document.querySelector("textarea").value != "") {
  p.parse(document.querySelector("textarea").value);
}

let notes = [... p.notes()];

function playSquare() {
  let osc = ctx.createOscillator();
  osc.type = "square";
  osc.connect(ctx.destination);
  let accumulator = 0;
  for (const note of notes) {
	osc.frequency.setValueAtTime(note.frequency, ctx.currentTime + accumulator/1000);
	accumulator += note.duration;
  }
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + accumulator/1000);
  return osc;
}

let playingOsc;
let playing = false;
document.getElementById("playButton").addEventListener("click", () => {
  if (!playing) {
	playingOsc = playSquare();
	playingOsc.addEventListener("ended", () => {
	  playing = false; 
	  playingOsc.disconnect();
	})
	playing = true;
  }
  console.log("hello,");
});

document.getElementById("stopButton").addEventListener("click", () => {
  playingOsc.stop();
});

document.querySelector("textarea").addEventListener("input", () => {
  p.parse(document.querySelector("textarea").value);
  notes = [... p.notes()];
});