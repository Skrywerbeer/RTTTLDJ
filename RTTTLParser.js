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
	returnData.duration = this.#bpmToMsPerBeat(this.bpm)/returnData.division;
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
  #bpmToMsPerBeat(bpm) {
	return (60/bpm)*1000;
  }
}