const sectors = [
  { label: "Perdu", chance: 92, color: "#7F8C8D", text: "#FFFFFF" },
  { label: "Soda", chance: 6, color: "#FF5A10", text: "#333333" },
  { label: "Barre Choco", chance: 2, color: "#FFBC03", text: "#333333" },
];

const totalChance = sectors.reduce((sum, s) => sum + s.chance, 0);
const ctx = document.querySelector("#wheel").getContext("2d");
const canvas = ctx.canvas;
const dia = canvas.width;
const rad = dia / 2;
const PI = Math.PI;
const TAU = 2 * PI;

let ang = 0;
let angVel = 0;
const friction = 0.991;
const spinEl = document.querySelector("#spin");
const resultEl = document.querySelector("#result");

function drawWheel() {
  let startAngle = 0;
  sectors.forEach(sector => {
    const arc = TAU * (sector.chance / totalChance);
    ctx.beginPath();
    ctx.fillStyle = sector.color;
    ctx.moveTo(rad, rad);
    ctx.arc(rad, rad, rad, startAngle, startAngle + arc);
    ctx.lineTo(rad, rad);
    ctx.fill();

    ctx.save();
    ctx.translate(rad, rad);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = sector.text;
    ctx.font = "bold 20px 'Lato', sans-serif";
    ctx.fillText(sector.label, rad - 20, 10);
    ctx.restore();

    startAngle += arc;
  });
}

function pickSector() {
  let rand = Math.random() * totalChance;
  for (const sector of sectors) {
    if (rand < sector.chance) return sector;
    rand -= sector.chance;
  }
  return sectors[sectors.length - 1];
}

function getTargetAngle(sector) {
  const idx = sectors.indexOf(sector);
  const arc = TAU / sectors.length;
  const baseAngle = idx * arc;
  
  // Ajoute une variation aléatoire dans le secteur pour éviter que ça tombe toujours pareil
  const randomOffset = Math.random() * arc;

  return baseAngle + randomOffset;
}

function rotate() {
  canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
}

function frame() {
  if (angVel) {
    angVel *= friction;
    if (angVel < 0.002) {
      angVel = 0;
      // Lorsque la roue s'arrête, afficher le résultat
      const chosenSector = pickSector();
      resultEl.textContent = chosenSector.label;
    }
    ang += angVel;
    ang %= TAU;
    rotate();
  }
  requestAnimationFrame(frame);
}

spinEl.addEventListener("click", () => {
  if (angVel === 0) {
    // Réinitialiser le message de résultat avant de commencer
    resultEl.textContent = "";

    const chosenSector = pickSector();
    const targetAngle = getTargetAngle(chosenSector);
    const rotations = 5;
    const currentMod = ang % TAU;
    let delta = (TAU - currentMod + targetAngle) % TAU;
    if (delta < 0.1) delta += TAU;
    const finalAngle = rotations * TAU + delta;
    angVel = finalAngle / 60;
  }
});

drawWheel();
rotate();
frame();
