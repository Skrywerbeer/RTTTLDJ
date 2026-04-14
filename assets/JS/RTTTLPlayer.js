export default class RTTTLPlayer {
  #ctx;

  constructor(audioContext) {
	if (!(audioContext instanceof AudioContext))
	  throw new Error("Argument error: Expected an AudioContext.");
	this.#ctx = audioContext;
	this.playing = false;
  }

  playSquare(notes) {
	let osc = this.#ctx.createOscillator();
	osc.type = "square";
	osc.connect(this.#ctx.destination);
	let accumulator = 0;
	osc.start(this.#ctx.currentTime);
	this.playingOsc = osc;
	this.playing = true;
	for (const note of notes) {
	  osc.frequency.setValueAtTime(note.frequency, this.#ctx.currentTime + accumulator/1000);
	  accumulator += note.duration;
	}
	osc.stop(this.#ctx.currentTime + accumulator/1000);
	osc.addEventListener("ended", () => {
	  this.playing = false;
	  osc.disconnect();
	})
	osc.connect(this.#ctx.destination);
  }

  stop() {
	this.playingOsc?.stop();
	this.playingOsc = undefined;
	this.playing = false;
  }
}