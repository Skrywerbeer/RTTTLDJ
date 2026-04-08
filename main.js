import RTTTLParser from "./RTTTLParser.js";

import RTTTLRepository from "./RTTTLRepository.js";

const testString =
	"HauntHouse: d=4,o=5,b=108: " +
	"2a4, 2e, 2d#, 2b4, 2a4, 2c, 2d," +
	" 2a#4, 2e., e, 1f4, 1a4, 1d#, 2e.," +
	" d, 2c., b4, 1a4, 1p, 2a4, 2e, 2d#," +
	" 2b4, 2a4, 2c, 2d, 2a#4, 2e., e, 1f4," +
	" 1a4, 1d#, 2e., d, 2c., b4, 1a4";

let p = new RTTTLParser(testString);
let ctx = new AudioContext();
const textArea = document.querySelector("textarea");
const newButton = document.getElementById("newButton");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");

textArea.value =
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
  console.log(repo.filenames)
})

let repo = new RTTTLRepository();
console.log(repo);
console.log(p);
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
		console.log(notes);
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
	// const li = document.createElement("li");
	// const btn = document.createElement("button");
	// btn.setAttribute("type", "button");
	// btn.textContent = filename;
	// li.appendChild(btn);
	// ul.appendChild(li);
	// btn.addEventListener("click", async () => {
	//   textArea.value = await repo.getFileTextAsync("./assets/tunes/" + filename);
	//   textArea.dispatchEvent(new InputEvent("input"));
	// });
  }
});