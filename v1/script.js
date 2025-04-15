const wheel = document.getElementById('wheel');
const resultText = document.getElementById('result');
const spinButton = document.getElementById('spin');

/* Ajuste les chances si tu veux plus de probabilités de Perdu */
const rewards = [
  { label: "Bonbon", chance: 10 },
  { label: "Soda",   chance: 5 },
  { label: "Sandwich", chance: 1 },
  { label: "Perdu",  chance: 84 },
];

let currentRotation = 0;

function getRandomReward() {
  const total = rewards.reduce((acc, r) => acc + r.chance, 0);
  const rand = Math.random() * total;
  let cumulative = 0;
  for (const reward of rewards) {
    cumulative += reward.chance;
    if (rand <= cumulative) return reward.label;
  }
}

function getSegmentIndexByReward(rewardLabel) {
  /* Ordre des segments dans le HTML */
  const labels = ["Bonbon", "Soda", "Sandwich", "Perdu", "Perdu", "Perdu"];
  return labels.findIndex(label => label === rewardLabel);
}

spinButton.addEventListener('click', () => {
  const reward = getRandomReward();
  const index = getSegmentIndexByReward(reward);

  const segmentAngle = 360 / 6; // 60°
  const stopAngle = index * segmentAngle;
  const randomExtra = Math.floor(Math.random() * 30) - 15; // +/- 15°

  const rotations = 5; // 5 tours complets
  const finalAngle = (rotations * 360) + (360 - stopAngle) + randomExtra;

  currentRotation += finalAngle;

  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    resultText.textContent = reward === "Perdu"
      ? "Dommage, retente ta chance ! 😢"
      : `Bravo ! Tu as gagné : ${reward} 🎉`;
  }, 4000);
});
