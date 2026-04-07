import NoteLUT from "./NoteLUT.js";

export default class RTTTLParser {
  #NoteLUT;

  constructor(parseString) {
	this.parse(parseString);
	this.#NoteLUT = new NoteLUT(100);
  }
  lut() {
	return this.#NoteLUT;
  }

  parse(parseString) {
	this.parsedString = parseString;
	this.#parseSections();
	this.#parseDefaultValues();
  }

  *notes() {
	for (const token of this.dataTokens)
	  yield this.parseDataToken(token);
	return;

  }

  parseDataToken(token) {
	if (!token || typeof(token) != "string")
	  throw new Error(`Argument error: expected string as argument for parseNote. Got: ${token}`);
	const matches = token.match(
		/(?<division>[0-9]+)?(?<letter>[a-gp])(?<octave>[0-9])?(?<sharp>#)?(?<dot>\.)?/
	);
	if (!matches.groups.letter)
	  throw new Error("Data token must contain one of [a, b, c, d, e, f, g, p].");
	const returnData  = {
	  division: matches.groups.division ? Number(matches.groups.division) : this.defaultDivision,
	  letter: matches.groups.letter,
	  octave: matches.groups.octave ? Number(matches.groups.octave) : this.defaultOctave,
	  sharp: matches.groups.sharp ? true : false,
	  dotted: matches.groups.dot ? true : false,
	}
	returnData.duration = 4*this.#bpmToMsPerBeat(this.bpm)/returnData.division
	if (returnData.dotted)
	  returnData.duration *= 1.5;
	returnData.frequency = this.#NoteLUT.lookupFrequency({
	  letter: returnData.letter,
	  octave: returnData.octave,
	  sharp: returnData.sharp
	});
	return returnData;
  }

  #parseSections() {
	let sections = this.parsedString.split(":");
	if (sections.length != 3)
	  throw new Error("Error parsing sections.");
	this.name = sections[0];
	this.defaultValuesSection = sections[1].split(",");
	this.defaultValuesSection.forEach((element, index, array) => { array[index] = element.trim(); });
	this.dataTokens = sections[2].split(",");
	this.dataTokens.forEach((element, index, array) => { array[index] = element.trim(); });
	// Some authors use a "," at the end.
	if (this.dataTokens[this.dataTokens.length - 1] == "")
	  this.dataTokens.pop();
  }

  #parseDefaultValues() {
	// Use .slice(2) to throw away the *= parts.
	// this.defaultDivision = Number(this.defaultValuesSection[0].slice(2));
	// this.defaultOctave = Number(this.defaultValuesSection[1].slice(2));
	// this.bpm = Number(this.defaultValuesSection[2].slice(2));
	const valuePairs = this.defaultValuesSection.map((ele) => ele.split("="));
	for (const pair of valuePairs) {
	  switch (pair[0]) {
		case ("d"):
		  this.defaultDivision = Number(pair[1]);
		  break;
		case ("o"):
		  this.defaultOctave = Number(pair[1]);
		  break;
		case ("b"):
		  this.bpm = Number(pair[1]);
		  break;
		default:
		  throw new Error("Error parsing default values.");
	  }
	}
  }
  #bpmToMsPerBeat(bpm) {
	return (60/bpm)*1000;
  }
}