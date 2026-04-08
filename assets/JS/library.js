import RTTTLParser from "./RTTTLParser.js";

import RTTTLRepository from "./RTTTLRepository.js";

const HauntedHouse =
	"HauntHouse: d=4,o=5,b=108: " +
	"2a4, 2e, 2d#, 2b4, 2a4, 2c, 2d," +
	" 2a#4, 2e., e, 1f4, 1a4, 1d#, 2e.," +
	" d, 2c., b4, 1a4, 1p, 2a4, 2e, 2d#," +
	" 2b4, 2a4, 2c, 2d, 2a#4, 2e., e, 1f4," +
	" 1a4, 1d#, 2e., d, 2c., b4, 1a4";

let p = new RTTTLParser(HauntedHouse);
let ctx = new AudioContext();
const textArea = document.querySelector("textarea");
const newButton = document.getElementById("newButton");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");

textArea.value = HauntedHouse;

if (textArea.value !== "") {
  p.parse(textArea.value);
}

let textAreaNotes = [... p.notes()];

function playSquare(notes) {
  let osc = ctx.createOscillator();
  osc.type = "square";
  osc.connect(ctx.destination);
  let accumulator = 0;
  osc.start(ctx.currentTime);
  for (const note of notes) {
	osc.frequency.setValueAtTime(note.frequency, ctx.currentTime + accumulator/1000);
	accumulator += note.duration;
  }
  osc.stop(ctx.currentTime + accumulator/1000);
  return osc;
}

let playingOsc;
let playing = false;
playButton.addEventListener("click", () => {
  if (!playing) {
	const notes = [...(new RTTTLParser(textArea.value)).notes()];
	playingOsc = playSquare(notes);
	playingOsc.addEventListener("ended", () => {
	  playing = false;
	  playingOsc.disconnect();
	})
	playing = true;
  }
});

stopButton.addEventListener("click", () => {
  playingOsc.stop();
});

textArea.addEventListener("input", () => {
  p.parse(textArea.value);
  textAreaNotes = [... p.notes()];
});

function newRingtone(newName, defaults) {
  if (typeof(newName) !== "string")
	throw new Error("Argument error: expected string for newName.");
  if (typeof(defaults) !== "string")
	throw new Error("Argument error: expected string for defaults")
  textArea.value = `${newName}:${defaults}:`;
}

newButton.addEventListener("click", () => {
  newRingtone("untitled", "d=4,o=4,b=100");
})

let repo = new RTTTLRepository();

repo.getFileListAsync().then((text) => {
  const ul = document.querySelector("#library ul");
  const filenames = text.split("\n");
  const template = document.getElementById("libraryCardTemplate");
  for (const filename of filenames) {
	const card = document.importNode(template.content, true);
	card.querySelector("label").textContent = filename;
	const buttons = card.querySelectorAll("button");
	buttons[0].addEventListener(("click"), async () => {
	  if (!playing) {
		const notes = [...(new RTTTLParser(await repo.getFileTextAsync("./assets/tunes/" + filename))).notes()];
		playingOsc = playSquare(notes);
		playingOsc.addEventListener("ended", () => {
		  playing = false;
		  playingOsc.disconnect();
		})
		playing = true;
	  }
	  else {
		playingOsc.stop();
		playingOsc.disconnect();
		playing = false;
	  }
	});
	buttons[1].addEventListener("click", async () => {
	  textArea.value = await repo.getFileTextAsync("./assets/tunes/" + filename);
	  textArea.dispatchEvent(new InputEvent("input"));
	});
	ul.appendChild(card);
  }
});