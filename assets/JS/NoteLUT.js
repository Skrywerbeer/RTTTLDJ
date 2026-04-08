export default class NoteLUT {
  #NOTE_LUT;
  constructor(count) {
	this.NOTE_LUT = [... this.#lutGenerator(count)];
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
	throw new Error(`Could not find ${note.letter}${note.sharp ? "#" : ""}${note.octave}.`);
  }

  *#noteGenerator() {
	const notes =
		[
		  {letter: "c", sharp: false},
		  {letter: "c", sharp: true},
		  {letter: "d", sharp: false},
		  {letter: "d", sharp: true},
		  {letter: "e", sharp: false},
		  {letter: "f", sharp: false},
		  {letter: "f", sharp: true},
		  {letter: "g", sharp: false},
		  {letter: "g", sharp: true},
		  {letter: "a", sharp: false},
		  {letter: "a", sharp: true},
		  {letter: "b", sharp: false}
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
	const c0Frequency = 16.3516;
	for (let i = 0; i < count; i++) {
	  yield {note: noteGen.next().value, frequency: c0Frequency*Math.pow(2, i/12)};
	}
	return;
  }
}