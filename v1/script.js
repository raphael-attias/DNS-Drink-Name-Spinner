// Définition des secteurs
// Nous voulons que la zone "Perdu" soit très présente, 
// on utilise ici trois secteurs consécutifs de même couleur pour "Perdu".
const sectors = [
  { color: "#FFBC03", text: "#333333", label: "Bonbon" },
  { color: "#FF5A10", text: "#333333", label: "Soda" },
  { color: "#FFBC03", text: "#333333", label: "Sandwich" },
  { color: "#7F8C8D", text: "#FFFFFF", label: "Perdu" },
  { color: "#7F8C8D", text: "#FFFFFF", label: "Perdu" },
  { color: "#7F8C8D", text: "#FFFFFF", label: "Perdu" },
  { color: "#FF5A10", text: "#333333", label: "Soda" },
  { color: "#FFBC03", text: "#333333", label: "Bonbon" },
];

// Gestion des événements (pour notifier la fin de la rotation)
const events = {
  listeners: {},
  addListener(eventName, fn) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(fn);
  },
  fire(eventName, ...args) {
    if (this.listeners[eventName]) {
      for (const fn of this.listeners[eventName]) {
        fn(...args);
      }
    }
  }
};

const rand = (m, M) => Math.random() * (M - m) + m;
const tot = sectors.length;
const spinEl = document.querySelector("#spin");
const ctx = document.querySelector("#wheel").getContext("2d");
const dia = ctx.canvas.width;
const rad = dia / 2;
const PI = Math.PI;
const TAU = 2 * PI;
const arc = TAU / tot; // Angle de chaque secteur

// Réglage de la friction et des variables de rotation
const friction = 0.991; // Plus ce nombre est proche de 1, plus la rotation ralentit doucement
let angVel = 0;  // Vitesse angulaire
let ang = 0;     // Angle actuel (en radians)
let spinButtonClicked = false;

// Renvoie l'indice du secteur gagnant d'après l'angle actuel
const getIndex = () => Math.floor(tot - (ang / TAU) * tot) % tot;

// Dessine un secteur sur la roue
function drawSector(sector, i) {
  const startAngle = arc * i;
  ctx.save();
  
  // Dessin du secteur
  ctx.beginPath();
  ctx.fillStyle = sector.color;
  ctx.moveTo(rad, rad);
  ctx.arc(rad, rad, rad, startAngle, startAngle + arc);
  ctx.lineTo(rad, rad);
  ctx.fill();
  
  // Positionnement du texte (au centre de l'arc)
  ctx.translate(rad, rad);
  ctx.rotate(startAngle + arc / 2);
  ctx.textAlign = "right";
  ctx.fillStyle = sector.text;
  ctx.font = "bold 30px 'Lato', sans-serif";
  ctx.fillText(sector.label, rad - 20, 10);
  
  ctx.restore();
}

// Met à jour l'affichage de la roue et du bouton (spin)
function rotate() {
  // La roue est tournée via une transformation CSS sur le canvas
  ctx.canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
  // Le texte et la couleur du bouton se mettent à jour en fonction du secteur sous le pointeur
  const sector = sectors[getIndex()];
  spinEl.textContent = !angVel ? "SPIN" : sector.label;
  spinEl.style.background = sector.color;
  spinEl.style.color = sector.text;
}

// Logique de mise à jour à chaque frame de l'animation
function frame() {
  // Lorsque la roue s'arrête et que le bouton a été cliqué, on déclenche un évènement
  if (!angVel && spinButtonClicked) {
    const finalSector = sectors[getIndex()];
    events.fire("spinEnd", finalSector);
    spinButtonClicked = false; // Réinitialisation du flag
    return;
  }

  angVel *= friction; // Diminution de la vitesse par effet de friction
  if (angVel < 0.002) angVel = 0; // Arrêt si la vitesse est trop faible
  ang += angVel;
  ang %= TAU; // Normalisation de l'angle pour qu'il reste dans 2π
  rotate();
}

// Fonction d'animation via requestAnimationFrame
function engine() {
  frame();
  requestAnimationFrame(engine);
}

// Initialisation de la roue
function init() {
  sectors.forEach(drawSector); // Dessine tous les secteurs
  rotate(); // Position initiale
  engine(); // Lance l'animation
  spinEl.addEventListener("click", () => {
    if (!angVel) {
      // On initie une nouvelle rotation avec une vitesse aléatoire
      angVel = rand(0.25, 0.45);
      spinButtonClicked = true;
    }
  });
}

init();

// Écouteur pour l'événement "spinEnd" (lorsque la roue s'arrête)
events.addListener("spinEnd", (sector) => {
  console.log(`Félicitations ! Tu as gagné : ${sector.label}`);
  // Ici, tu pourrais afficher un message à l'utilisateur ou effectuer d'autres actions.
});
