const settingsScreen = document.getElementById("settingsScreen");
const clockScreen = document.getElementById("clockScreen");

const goBtn = document.getElementById("goBtn");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

const clockA = document.getElementById("clockA");
const clockB = document.getElementById("clockB");

const timeA = document.getElementById("timeA");
const timeB = document.getElementById("timeB");
const status = document.getElementById("status");

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function render() {
  timeA.innerText = formatTime(gameState.players.A.remainingTime);
  timeB.innerText = formatTime(gameState.players.B.remainingTime);

  clockA.classList.remove("active", "inactive");
  clockB.classList.remove("active", "inactive");

  if (gameState.isRunning && !gameState.isGameOver) {
    if (gameState.turn === "A") {
      clockA.classList.add("active");
      clockB.classList.add("inactive");
    } else {
      clockB.classList.add("active");
      clockA.classList.add("inactive");
    }
  }

  status.innerText = gameState.isGameOver
    ? `Game Over — Player ${gameState.winner} wins`
    : gameState.isRunning ? "Running" : "Paused";
}

goBtn.onclick = () => {
  const minutes = parseInt(document.getElementById("minutesInput").value);
  const inc = parseInt(document.getElementById("incrementInput").value);
  const method = document.getElementById("methodInput").value;

  gameState.settings.baseTime = minutes * 60;
  gameState.settings.increment = method === "fischer" ? inc : 0;
  gameState.settings.delay = method === "delay" ? inc : 0;

  resetGame();

  settingsScreen.classList.add("hidden");
  clockScreen.classList.remove("hidden");

  startGame();
  render();
};

pauseBtn.onclick = () => {
  pauseGame();
  render();
};

resetBtn.onclick = () => {
  resetGame();
  startGame();
  render();
};

clockA.onclick = () => {
  if (gameState.turn === "B") switchTurn();
};

clockB.onclick = () => {
  if (gameState.turn === "A") switchTurn();
};

setInterval(() => {
  tick();
  render();
}, 1000);
