// Configuration des secteurs de la roue
const sectors = [
  { label: "Perdu", chance: 97.5, color: "#333", text: "#FFFFFF" },
  { label: "Soda", chance: 1, color: "#6e8efb", text: "#333333" },
  { label: "Barre Choco", chance: 0.5, color: "#a777e3", text: "#333333" },
  { label: "1 Frite !", chance: 1, color: "#FF9800", text: "#333333" },
];

// Constantes et sélecteurs d'éléments
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
 * Réorganise les secteurs pour avoir un design triangulaire pour les prix
 */
function getWheelDesign() {
  // Extraire le secteur "Perdu" et les secteurs de prix
  const losingSection = sectors.find(s => s.label === "Perdu");
  const prizesSections = sectors.filter(s => s.label !== "Perdu");
  const triangleAngle = TAU / 16; // Angle pour chaque triangle de prix (1/16 du cercle)
  
  // Calcul des positions angulaires
  const wheelSections = [];
  let currentAngle = 0;
  
  // Ajouts des secteurs de prix à intervalles réguliers
  for (let i = 0; i < prizesSections.length; i++) {
    const prizeSection = prizesSections[i];
    wheelSections.push({
      ...prizeSection,
      startAngle: currentAngle,
      endAngle: currentAngle + triangleAngle,
      isTriangle: true
    });
    
    // Ajout d'un secteur "Perdu" entre chaque prix
    const segmentBetweenPrizes = (i === prizesSections.length - 1) 
      ? TAU - (currentAngle + triangleAngle) // Dernier segment va jusqu'à la fin du cercle
      : (TAU / prizesSections.length) - triangleAngle; // Répartition égale entre les prix
    
    wheelSections.push({
      ...losingSection,
      startAngle: currentAngle + triangleAngle,
      endAngle: currentAngle + triangleAngle + segmentBetweenPrizes,
      isTriangle: false
    });
    
    // Mise à jour de l'angle actuel pour le prochain secteur
    currentAngle += triangleAngle + segmentBetweenPrizes;
  }
  
  return wheelSections;
}

/**
 * Dessine la roue avec tous ses secteurs
 */
function drawWheel() {
  ctx.clearRect(0, 0, dia, dia);
  
  // Dessine un cercle de fond
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  ctx.arc(rad, rad, rad, 0, TAU);
  ctx.fill();
  
  // Obtenir la disposition des secteurs
  const wheelSections = getWheelDesign();
  
  // Dessine chaque secteur
  wheelSections.forEach(section => {
    // Dessine le secteur
    ctx.beginPath();
    ctx.fillStyle = section.color;
    ctx.moveTo(rad, rad);
    ctx.arc(rad, rad, rad, section.startAngle, section.endAngle);
    ctx.lineTo(rad, rad);
    ctx.fill();
    
    // Ajout d'une bordure entre les secteurs
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.moveTo(rad, rad);
    ctx.arc(rad, rad, rad, section.startAngle, section.endAngle);
    ctx.lineTo(rad, rad);
    ctx.stroke();
    
    // Ajout du texte du secteur
    drawSectorText(section);
  });
}

/**
 * Dessine le texte dans un secteur
 */
function drawSectorText(section) {
  const centerAngle = (section.startAngle + section.endAngle) / 2;
  const arcSize = section.endAngle - section.startAngle;
  
  ctx.save();
  ctx.translate(rad, rad);
  ctx.rotate(centerAngle);
  
  // Paramètres du texte
  ctx.textAlign = "center";
  ctx.fillStyle = section.text;
  
  // Adapte la taille du texte selon le type de secteur
  if (section.isTriangle) {
    ctx.font = "bold 16px 'Lato', sans-serif";
    
    // Pour les triangles, le texte doit être placé plus près du bord
    // et orienté vers le centre
    ctx.textAlign = "right";
    ctx.fillText(section.label, rad * 0.85, 0);
  } else {
    // Pour le secteur "Perdu", la taille du texte dépend de l'arc
    const fontSize = Math.min(20, Math.max(12, arcSize * 10));
    ctx.font = `bold ${fontSize}px 'Lato', sans-serif`;
    
    // Placer le texte "Perdu" à mi-chemin entre le centre et le bord
    // seulement s'il y a assez d'espace
    if (arcSize > 0.4) {
      ctx.textAlign = "center";
      ctx.fillText(section.label, rad * 0.5, 0);
    }
  }
  
  ctx.restore();
}

/**
 * Sélectionne un secteur basé sur les probabilités
 */
function pickSector() {
  const totalChance = sectors.reduce((sum, s) => sum + s.chance, 0);
  const rand = Math.random() * totalChance;
  let accumulator = 0;
  
  for (const sector of sectors) {
    accumulator += sector.chance;
    if (rand <= accumulator) return sector;
  }
  
  // Fallback - ne devrait jamais arriver avec un calcul correct
  return sectors[0];
}

/**
 * Trouve un secteur correspondant à l'étiquette donnée
 */
function getSectorByLabel(label) {
  const wheelSections = getWheelDesign();
  return wheelSections.find(section => section.label === label);
}

/**
 * Calcule l'angle cible pour un secteur donné
 */
function getTargetAngle(sector) {
  // Trouver le secteur correspondant dans notre design de roue
  const wheelSection = getSectorByLabel(sector.label);
  
  if (!wheelSection) return 0;
  
  // Calculer un angle aléatoire dans le secteur cible
  const sectionSize = wheelSection.endAngle - wheelSection.startAngle;
  const randomOffset = Math.random() * sectionSize * 0.8;
  
  // L'angle cible est l'angle de départ + un décalage
  return wheelSection.startAngle + randomOffset;
}

/**
 * Trouve le secteur correspondant à l'angle donné
 */
function getSectorAtAngle(angle) {
  const wheelSections = getWheelDesign();
  const normalizedAngle = angle % TAU;
  
  for (const section of wheelSections) {
    if (normalizedAngle >= section.startAngle && normalizedAngle < section.endAngle) {
      return section;
    }
  }
  
  // Fallback au premier secteur
  return wheelSections[0];
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
  const colors = ['#6e8efb', '#a777e3', '#FF9800', '#00B74A', '#9C27B0', '#F44336', '#3F51B5'];
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
  
  // Variété de formes pour les confettis
  const shapeType = Math.floor(Math.random() * 3);
  
  switch (shapeType % 3) {
    case 0: // Carré
      ctx.fillRect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
      break;
    case 1: // Cercle
      ctx.beginPath();
      ctx.arc(0, 0, confetti.size / 2, 0, TAU);
      ctx.fill();
      break;
    case 2: // Triangle
      ctx.beginPath();
      ctx.moveTo(-confetti.size / 2, confetti.size / 2);
      ctx.lineTo(confetti.size / 2, confetti.size / 2);
      ctx.lineTo(0, -confetti.size / 2);
      ctx.closePath();
      ctx.fill();
      break;
  }
  
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
      const result = getSectorAtAngle(pointerAngle);
      
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