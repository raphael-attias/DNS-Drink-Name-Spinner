// Configuration des secteurs de la roue
const sectors = [
  { label: "Perdu", chance: 92, color: "#333", text: "#FFFFFF" },
  { label: "Soda", chance: 6, color: "#FF5A10", text: "#333333" },
  { label: "Barre Choco", chance: 2, color: "#FFBC03", text: "#333333" },
];

// Constantes et sélecteurs d'éléments
const totalChance = sectors.reduce((sum, s) => sum + s.chance, 0);
const canvas = document.querySelector("#wheel");
const ctx = canvas.getContext("2d");
const dia = canvas.width;
const rad = dia / 2;
const PI = Math.PI;
const TAU = 2 * PI;
const spinEl = document.querySelector("#spin");
const resultEl = document.querySelector("#result");

// Variables d'état
let ang = 0;
let angVel = 0;
let isSpinning = false;
const friction = 0.991;
const minSpinTime = 3000; // Temps minimum de rotation en ms
let spinStartTime = 0;

// Variables pour les confettis
let confetti = [];
let confettiActive = false;

/**
 * Dessine la roue avec tous ses secteurs
 */
function drawWheel() {
  ctx.clearRect(0, 0, dia, dia);
  
  // Dessiner un cercle de fond
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  ctx.arc(rad, rad, rad, 0, TAU);
  ctx.fill();
  
  // Calculer l'angle de chaque secteur
  const sectorAngles = calculateSectorAngles();
  
  // Dessiner chaque secteur
  let startAngle = 0;
  sectors.forEach((sector, index) => {
    const arc = sectorAngles[index];
    
    // Dessiner le secteur
    ctx.beginPath();
    ctx.fillStyle = sector.color;
    ctx.moveTo(rad, rad);
    ctx.arc(rad, rad, rad, startAngle, startAngle + arc);
    ctx.lineTo(rad, rad);
    ctx.fill();
    
    // Ajouter une bordure entre les secteurs
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.moveTo(rad, rad);
    ctx.arc(rad, rad, rad, startAngle, startAngle + arc);
    ctx.lineTo(rad, rad);
    ctx.stroke();
    
    // Ajouter le texte du secteur
    drawSectorText(sector.label, sector.text, startAngle, arc);
    
    startAngle += arc;
  });
}

/**
 * Calcule l'angle de chaque secteur en fonction de sa chance
 */
function calculateSectorAngles() {
  return sectors.map(sector => TAU * (sector.chance / totalChance));
}

/**
 * Dessine le texte dans un secteur
 */
function drawSectorText(label, textColor, startAngle, arc) {
  ctx.save();
  ctx.translate(rad, rad);
  ctx.rotate(startAngle + arc / 2);
  
  // Paramètres du texte
  ctx.textAlign = "right";
  ctx.fillStyle = textColor;
  ctx.font = "bold 20px 'Lato', sans-serif";
  
  // Calculer la distance du texte par rapport au centre
  const textDistance = rad * 0.75;
  
  // Dessiner le texte
  ctx.fillText(label, textDistance, 8);
  ctx.restore();
}

/**
 * Sélectionne un secteur basé sur les probabilités
 */
function pickSector() {
  const rand = Math.random() * totalChance;
  let accumulator = 0;
  
  for (const sector of sectors) {
    accumulator += sector.chance;
    if (rand <= accumulator) return sector;
  }
  
  // Fallback - ne devrait jamais arriver avec un calcul correct
  return sectors[sectors.length - 1];
}

/**
 * Calcule l'angle cible pour un secteur donné
 */
function getTargetAngle(sector) {
  const sectorAngles = calculateSectorAngles();
  const sectorIndex = sectors.indexOf(sector);
  
  // Calculer l'angle de départ du secteur
  let startAngle = 0;
  for (let i = 0; i < sectorIndex; i++) {
    startAngle += sectorAngles[i];
  }
  
  // Ajouter un décalage aléatoire à l'intérieur du secteur
  const randomOffset = Math.random() * sectorAngles[sectorIndex] * 0.8;
  
  // L'angle cible est l'angle de départ + un décalage
  return startAngle + randomOffset;
}

/**
 * Applique la rotation à la roue
 */
function rotate() {
  canvas.style.transform = `rotate(${ang - PI / 2}rad)`;
}

/**
 * Crée le canvas pour les confettis
 */
function createConfettiCanvas() {
  const confettiCanvas = document.createElement('canvas');
  confettiCanvas.id = 'confetti-canvas';
  confettiCanvas.style.position = 'fixed';
  confettiCanvas.style.top = '0';
  confettiCanvas.style.left = '0';
  confettiCanvas.style.width = '100%';
  confettiCanvas.style.height = '100%';
  confettiCanvas.style.pointerEvents = 'none';
  confettiCanvas.style.zIndex = '100';
  document.body.appendChild(confettiCanvas);
  
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  
  return confettiCanvas;
}

/**
 * Génère des confettis aléatoires
 */
function generateConfetti(count) {
  const colors = ['#FF5A10', '#FFBC03', '#004aad', '#00B74A', '#9C27B0', '#F44336', '#3F51B5'];
  const confetti = [];
  
  for (let i = 0; i < count; i++) {
    confetti.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 6 - 3,
      speedRotation: Math.random() * 2 - 1
    });
  }
  
  return confetti;
}

/**
 * Dessine un confetti
 */
function drawConfetti(ctx, confetti) {
  ctx.save();
  ctx.translate(confetti.x, confetti.y);
  ctx.rotate(confetti.rotation * Math.PI / 180);
  
  ctx.fillStyle = confetti.color;
  ctx.fillRect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
  
  ctx.restore();
}

/**
 * Met à jour la position des confettis et les dessine
 */
function updateConfetti(confettiCanvas) {
  const ctx = confettiCanvas.getContext('2d');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  
  if (confetti.length === 0) {
    confettiActive = false;
    document.body.removeChild(confettiCanvas);
    return;
  }
  
  for (let i = 0; i < confetti.length; i++) {
    const c = confetti[i];
    c.y += c.speedY;
    c.x += c.speedX;
    c.rotation += c.speedRotation;
    
    // Si le confetti est en dehors de l'écran, le supprimer
    if (c.y > window.innerHeight + 50) {
      confetti.splice(i, 1);
      i--;
      continue;
    }
    
    drawConfetti(ctx, c);
  }
  
  requestAnimationFrame(() => updateConfetti(confettiCanvas));
}

/**
 * Lance l'animation de confettis
 */
function startConfettiAnimation() {
  if (confettiActive) return;
  
  confettiActive = true;
  const confettiCanvas = createConfettiCanvas();
  confetti = generateConfetti(200);
  updateConfetti(confettiCanvas);
}

/**
 * Affiche une animation quand un prix est gagné
 */
function showWinAnimation(label) {
  if (label !== "Perdu") {
    // Animation visuelle du texte
    resultEl.style.color = "#FFD700"; // Couleur dorée pour les gains
    resultEl.style.fontSize = "1.8em";
    resultEl.style.textShadow = "0 0 10px rgba(255, 215, 0, 0.7)";
    
    // Animation de pulse
    const pulse = () => {
      resultEl.style.transform = "translate(-50%, -50%) scale(1.1)";
      setTimeout(() => {
        resultEl.style.transform = "translate(-50%, -50%) scale(1)";
      }, 200);
    };
    
    // Exécuter l'animation plusieurs fois
    for (let i = 0; i < 3; i++) {
      setTimeout(pulse, i * 400);
    }
    
    // Lancer l'animation de confettis
    startConfettiAnimation();
    
    // Restaurer le style après l'animation
    setTimeout(() => {
      resultEl.style.color = "gray";
      resultEl.style.fontSize = "1.5em";
      resultEl.style.textShadow = "2px 2px 4px #000";
      resultEl.style.transform = "translate(-50%, -50%)";
    }, 2000);
  }
}

/**
 * Boucle d'animation principale
 */
function frame() {
  const now = Date.now();
  
  if (angVel > 0) {
    // Appliquer la friction progressivement
    const timeSpinning = now - spinStartTime;
    if (timeSpinning > minSpinTime) {
      angVel *= friction;
    }
    
    // Vérifier si la roue doit s'arrêter
    if (angVel < 0.002) {
      angVel = 0;
      isSpinning = false;
      spinEl.textContent = "SPIN";
      spinEl.style.opacity = "1";
      
      // Déterminer le résultat
      const pointerAngle = (TAU - (ang % TAU)) % TAU;
      const result = getResultFromAngle(pointerAngle);
      
      // Afficher le résultat
      resultEl.textContent = result.label;
      showWinAnimation(result.label);
    }
    
    // Mettre à jour l'angle et appliquer la rotation
    ang += angVel;
    ang %= TAU;
    rotate();
  }
  
  requestAnimationFrame(frame);
}

/**
 * Détermine le secteur sur lequel la roue s'est arrêtée
 */
function getResultFromAngle(pointerAngle) {
  const sectorAngles = calculateSectorAngles();
  let currentAngle = 0;
  
  for (let i = 0; i < sectors.length; i++) {
    currentAngle += sectorAngles[i];
    if (pointerAngle < currentAngle) {
      return sectors[i];
    }
  }
  
  return sectors[0];
}

/**
 * Gère le clic sur le bouton de rotation
 */
function handleSpin() {
  if (isSpinning) return;
  
  isSpinning = true;
  spinStartTime = Date.now();
  spinEl.textContent = "...";
  spinEl.style.opacity = "0.7";
  resultEl.textContent = "";
  
  // Sélectionner un secteur selon les probabilités
  const chosenSector = pickSector();
  
  // Calculer l'angle cible et la vitesse de rotation
  const targetAngle = getTargetAngle(chosenSector);
  const rotations = 4 + Math.random() * 3; // Entre 4 et 7 rotations
  const currentMod = ang % TAU;
  let delta = (TAU - currentMod + targetAngle) % TAU;
  
  // S'assurer que la roue fait au moins un tour complet
  if (delta < 0.1) delta += TAU;
  
  const finalAngle = rotations * TAU + delta;
  
  // Définir la vitesse angulaire en fonction du temps de rotation souhaité
  const spinDuration = 5000 + Math.random() * 2000; // Entre 5 et 7 secondes
  angVel = finalAngle / (spinDuration / 16.67); // 16.67ms est environ une frame à 60fps
}

// Gérer le redimensionnement de la fenêtre pour le canvas de confettis
window.addEventListener('resize', () => {
  if (confettiActive) {
    const confettiCanvas = document.getElementById('confetti-canvas');
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  }
});

// Initialisation
function init() {
  // Dessiner la roue initiale
  drawWheel();
  rotate();
  
  // Ajouter les écouteurs d'événements
  spinEl.addEventListener("click", handleSpin);
  
  // Ajouter des effets au survol du bouton
  spinEl.addEventListener("mouseover", () => {
    spinEl.style.boxShadow = "0 0 0 6px #004aad, 0 0px 15px 6px rgba(0, 74, 173, 0.6)";
  });
  
  spinEl.addEventListener("mouseout", () => {
    spinEl.style.boxShadow = "0 0 0 6px #004aad, 0 0px 10px 4px rgba(0, 0, 0, 0.5)";
  });
  
  // Démarrer la boucle d'animation
  frame();
}

// Lancer l'initialisation quand le document est prêt
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}