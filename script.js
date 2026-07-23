// ===============================
// Audio Context for Sounds
// ===============================
let audioContext = null;
let tickEnabled = true;
let vibrationEnabled = true;
let tickSoundType = 'antique';

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Antique pocket watch ticking sound
function playAntiqueTickn() {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 300;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.08);
  
  setTimeout(() => {
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 250;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.06);
    osc2.start(audioContext.currentTime);
    osc2.stop(audioContext.currentTime + 0.06);
  }, 10);
}

// Modern click sound
function playModernTick() {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 1000;
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.03);
}

// Soft beep sound
function playSoftTick() {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 600;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
}

function playTick() {
  if (!tickEnabled || !audioContext || tickSoundType === 'none') return;
  
  if (tickSoundType === 'antique') {
    playAntiqueTickn();
  } else if (tickSoundType === 'modern') {
    playModernTick();
  } else if (tickSoundType === 'soft') {
    playSoftTick();
  }
}

function playBeep(frequency = 440, duration = 0.2) {
  if (!tickEnabled || !audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function vibrate(pattern) {
  if (vibrationEnabled && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// ===============================
// Game State
// ===============================
const gameState = {
  players: {
    A: { 
      remainingTime: 0,
      name: 'Player 1',
      moves: 0
    },
    B: { 
      remainingTime: 0,
      name: 'Player 2',
      moves: 0
    }
  },

  turn: null,
  isRunning: false,
  isPaused: false,
  isGameOver: false,
  winner: null,
  gameStartTime: null,
  
  lastTickTime: null,
  delayRemaining: 0,
  lastBeepAt30: false,
  lastBeepAt10: false,

  settings: {
    baseTimeA: 300,
    baseTimeB: 300,
    increment: 0,
    delay: 0,
    method: 'fischer',
    timeDifferent: false,
    useSpacebar: true
  }
};

// ===============================
// Statistics Storage
// ===============================
function getStats() {
  const stats = localStorage.getItem('chessClockStats');
  return stats ? JSON.parse(stats) : {
    totalGames: 0,
    player1Wins: 0,
    player2Wins: 0,
    totalGameTime: 0,
    gameHistory: []
  };
}

function saveStats(stats) {
  localStorage.setItem('chessClockStats', JSON.stringify(stats));
}

function addGameToHistory(winner, duration, player1Name, player2Name) {
  const stats = getStats();
  
  stats.totalGames++;
  if (winner === 'A') stats.player1Wins++;
  if (winner === 'B') stats.player2Wins++;
  stats.totalGameTime += duration;
  
  stats.gameHistory.unshift({
    date: new Date().toISOString(),
    winner: winner === 'A' ? player1Name : player2Name,
    duration: duration,
    player1: player1Name,
    player2: player2Name,
    movesA: gameState.players.A.moves,
    movesB: gameState.players.B.moves
  });
  
  // Keep only last 50 games
  if (stats.gameHistory.length > 50) {
    stats.gameHistory = stats.gameHistory.slice(0, 50);
  }
  
  saveStats(stats);
}

// ===============================
// Reset Game
// ===============================
function resetGame() {
  gameState.players.A.remainingTime = gameState.settings.baseTimeA;
  gameState.players.B.remainingTime = gameState.settings.baseTimeB;
  gameState.players.A.moves = 0;
  gameState.players.B.moves = 0;

  gameState.turn = null;
  gameState.isRunning = false;
  gameState.isPaused = false;
  gameState.isGameOver = false;
  gameState.winner = null;
  gameState.gameStartTime = null;
  gameState.lastTickTime = null;
  gameState.delayRemaining = 0;
  gameState.lastBeepAt30 = false;
  gameState.lastBeepAt10 = false;
}

// ===============================
// Start / Pause
// ===============================
function startGame() {
  if (gameState.isGameOver) return;
  gameState.isRunning = true;
  gameState.isPaused = false;
  gameState.lastTickTime = Date.now();
  
  if (gameState.turn === null) {
    gameState.turn = "A";
    gameState.delayRemaining = gameState.settings.delay;
    gameState.gameStartTime = Date.now();
  }
}

function pauseGame() {
  if (!gameState.isRunning || gameState.isGameOver) return;
  gameState.isRunning = false;
  gameState.isPaused = true;
  gameState.lastTickTime = null;
}

function togglePause() {
  if (gameState.isRunning) {
    pauseGame();
  } else if (!gameState.isGameOver) {
    startGame();
  }
}

// ===============================
// Switch Turn
// ===============================
function switchTurn() {
  if (!gameState.isRunning || gameState.isGameOver || gameState.turn === null) return;

  const current = gameState.turn;
  
  // Increment move counter
  gameState.players[current].moves++;
  
  // Play tick sound and vibrate
  initAudio();
  playTick();
  vibrate(50);
  
  // Apply increment (Fischer method)
  if (gameState.settings.method === 'fischer' && gameState.settings.increment > 0) {
    gameState.players[current].remainingTime += gameState.settings.increment;
  }

  // Switch player
  gameState.turn = current === "A" ? "B" : "A";
  
  // Reset delay for new turn
  gameState.delayRemaining = gameState.settings.delay;
  gameState.lastTickTime = Date.now();
  gameState.lastBeepAt30 = false;
  gameState.lastBeepAt10 = false;
}

// ===============================
// Game Over
// ===============================
function gameOver(winner) {
  gameState.isRunning = false;
  gameState.isGameOver = true;
  gameState.winner = winner;
  gameState.lastTickTime = null;
  
  // Calculate game duration
  const duration = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
  
  // Save to statistics
  addGameToHistory(winner, duration, gameState.players.A.name, gameState.players.B.name);
  
  // Play game over sound and vibrate
  initAudio();
  playBeep(220, 0.5);
  vibrate([100, 50, 100]);
}

// ===============================
// Tick (high precision)
// ===============================
function tick() {
  if (!gameState.isRunning || gameState.isGameOver || gameState.turn === null) return;

  const now = Date.now();
  if (gameState.lastTickTime === null) {
    gameState.lastTickTime = now;
    return;
  }

  const elapsed = (now - gameState.lastTickTime) / 1000;
  gameState.lastTickTime = now;

  // Handle delay period
  if (gameState.delayRemaining > 0) {
    gameState.delayRemaining -= elapsed;
    if (gameState.delayRemaining < 0) {
      gameState.delayRemaining = 0;
    }
    return;
  }

  // Decrement current player's time
  const currentPlayer = gameState.players[gameState.turn];
  currentPlayer.remainingTime -= elapsed;

  // Check for beep alerts
  if (currentPlayer.remainingTime <= 30 && currentPlayer.remainingTime > 29 && !gameState.lastBeepAt30) {
    initAudio();
    playBeep(600, 0.15);
    vibrate(100);
    gameState.lastBeepAt30 = true;
  }
  
  if (currentPlayer.remainingTime <= 10 && currentPlayer.remainingTime > 9 && !gameState.lastBeepAt10) {
    initAudio();
    playBeep(800, 0.15);
    vibrate([50, 50, 50]);
    gameState.lastBeepAt10 = true;
  }

  // Check for time out
  if (currentPlayer.remainingTime <= 0) {
    currentPlayer.remainingTime = 0;
    const winner = gameState.turn === "A" ? "B" : "A";
    gameOver(winner);
  }
}

// ===============================
// UI Elements
// ===============================
const settingsScreen = document.getElementById("settingsScreen");
const instructionScreen = document.getElementById("instructionScreen");
const clockScreen = document.getElementById("clockScreen");
const statsScreen = document.getElementById("statsScreen");

const goBtn = document.getElementById("goBtn");
const startGameBtn = document.getElementById("startGameBtn");
const pauseBtn = document.getElementById("pause");
const soundBtn = document.getElementById("sound");
const resetBtn = document.getElementById("reset");
const settingsBtn = document.getElementById("settings");
const fullscreenBtn = document.getElementById("fullscreen");
const themeToggle = document.getElementById("themeToggle");
const viewStatsBtn = document.getElementById("viewStatsBtn");
const backToSettingsBtn = document.getElementById("backToSettingsBtn");
const clearStatsBtn = document.getElementById("clearStatsBtn");

const clockA = document.getElementById("clockA");
const clockB = document.getElementById("clockB");

const timeA = document.getElementById("timeA");
const timeB = document.getElementById("timeB");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const movesA = document.getElementById("movesA");
const movesB = document.getElementById("movesB");
const status = document.getElementById("status");

// Toggle switches
const timeDiffToggle = document.getElementById("timeDiffToggle");
const soundToggle = document.getElementById("soundToggle");
const spacebarToggle = document.getElementById("spacebarToggle");
const vibrationToggle = document.getElementById("vibrationToggle");
const tickSoundSelect = document.getElementById("tickSoundSelect");

// Time inputs
const timeDiffSettings = document.getElementById("timeDiffSettings");
const sameTimeSettings = document.getElementById("sameTimeSettings");

function formatTime(seconds) {
  const totalSec = Math.ceil(Math.max(0, seconds));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function render() {
  timeA.innerText = formatTime(gameState.players.A.remainingTime);
  timeB.innerText = formatTime(gameState.players.B.remainingTime);
  
  movesA.innerText = `${gameState.players.A.moves} move${gameState.players.A.moves !== 1 ? 's' : ''}`;
  movesB.innerText = `${gameState.players.B.moves} move${gameState.players.B.moves !== 1 ? 's' : ''}`;

  clockA.classList.remove("active", "inactive", "warning");
  clockB.classList.remove("active", "inactive", "warning");

  // Add warning class if time is low (under 30 seconds)
  if (gameState.players.A.remainingTime <= 30 && gameState.players.A.remainingTime > 0) {
    clockA.classList.add("warning");
  }
  if (gameState.players.B.remainingTime <= 30 && gameState.players.B.remainingTime > 0) {
    clockB.classList.add("warning");
  }

  if (gameState.isRunning && !gameState.isGameOver && gameState.turn !== null) {
    if (gameState.turn === "A") {
      clockA.classList.add("active");
      clockB.classList.add("inactive");
    } else {
      clockB.classList.add("active");
      clockA.classList.add("inactive");
    }
  }

  if (gameState.isGameOver) {
    const winnerName = gameState.winner === "A" ? gameState.players.A.name : gameState.players.B.name;
    status.innerText = `Game Over — ${winnerName} wins!`;
  } else if (gameState.isPaused) {
    status.innerText = "Paused";
  } else if (gameState.isRunning) {
    const currentName = gameState.turn === "A" ? gameState.players.A.name : gameState.players.B.name;
    status.innerText = `${currentName}'s turn`;
  } else {
    status.innerText = "Tap opponent's clock to start";
  }

  pauseBtn.innerText = gameState.isRunning ? "⏸" : "▶";
  soundBtn.classList.toggle("active", tickEnabled);
}

function renderStats() {
  const stats = getStats();
  
  document.getElementById('totalGames').innerText = stats.totalGames;
  document.getElementById('player1Wins').innerText = stats.player1Wins;
  document.getElementById('player2Wins').innerText = stats.player2Wins;
  
  const avgTime = stats.totalGames > 0 ? Math.floor(stats.totalGameTime / stats.totalGames) : 0;
  document.getElementById('avgGameTime').innerText = formatDuration(avgTime);
  
  const historyList = document.getElementById('historyList');
  
  if (stats.gameHistory.length === 0) {
    historyList.innerHTML = '<div class="empty-history">No games played yet</div>';
  } else {
    historyList.innerHTML = stats.gameHistory.map(game => {
      const date = new Date(game.date);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      return `
        <div class="history-item">
          <div>
            <div class="history-winner">🏆 ${game.winner}</div>
            <div style="font-size: 12px; opacity: 0.6;">${game.player1} (${game.movesA}) vs ${game.player2} (${game.movesB})</div>
          </div>
          <div class="history-time">
            ${formatDuration(game.duration)}<br>
            <span style="font-size: 11px;">${dateStr}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ===============================
// Preset Buttons
// ===============================
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    const minutes = parseInt(btn.dataset.minutes);
    const increment = parseInt(btn.dataset.increment);
    
    document.getElementById('minutesInput').value = minutes;
    document.getElementById('incrementInput').value = increment;
    document.getElementById('methodInput').value = 'fischer';
  };
});

// ===============================
// Theme Toggle
// ===============================
themeToggle.onclick = () => {
  document.body.classList.toggle('light-mode');
  themeToggle.innerText = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
};

// ===============================
// Toggle Switch Handlers
// ===============================
timeDiffToggle.onclick = () => {
  timeDiffToggle.classList.toggle("active");
  gameState.settings.timeDifferent = timeDiffToggle.classList.contains("active");
  
  if (gameState.settings.timeDifferent) {
    timeDiffSettings.classList.remove('hidden');
    sameTimeSettings.classList.add('hidden');
  } else {
    timeDiffSettings.classList.add('hidden');
    sameTimeSettings.classList.remove('hidden');
  }
};

soundToggle.onclick = () => {
  soundToggle.classList.toggle("active");
  tickEnabled = soundToggle.classList.contains("active");
};

spacebarToggle.onclick = () => {
  spacebarToggle.classList.toggle("active");
  gameState.settings.useSpacebar = spacebarToggle.classList.contains("active");
};

vibrationToggle.onclick = () => {
  vibrationToggle.classList.toggle("active");
  vibrationEnabled = vibrationToggle.classList.contains("active");
};

tickSoundSelect.onchange = () => {
  tickSoundType = tickSoundSelect.value;
};

// ===============================
// Event Handlers
// ===============================
goBtn.onclick = () => {
  const player1Name = document.getElementById("player1Name").value.trim() || "Player 1";
  const player2Name = document.getElementById("player2Name").value.trim() || "Player 2";
  
  gameState.players.A.name = player1Name;
  gameState.players.B.name = player2Name;
  
  if (gameState.settings.timeDifferent) {
    const minutes1 = parseInt(document.getElementById("minutes1Input").value) || 5;
    const minutes2 = parseInt(document.getElementById("minutes2Input").value) || 3;
    gameState.settings.baseTimeA = minutes1 * 60;
    gameState.settings.baseTimeB = minutes2 * 60;
  } else {
    const minutes = parseInt(document.getElementById("minutesInput").value) || 5;
    gameState.settings.baseTimeA = minutes * 60;
    gameState.settings.baseTimeB = minutes * 60;
  }
  
  const inc = parseInt(document.getElementById("incrementInput").value) || 0;
  const method = document.getElementById("methodInput").value;

  gameState.settings.increment = inc;
  gameState.settings.delay = method === "delay" ? inc : 0;
  gameState.settings.method = method;

  settingsScreen.classList.add("hidden");
  instructionScreen.classList.remove("hidden");
};

startGameBtn.onclick = () => {
  resetGame();
  labelA.innerText = gameState.players.A.name;
  labelB.innerText = gameState.players.B.name;
  instructionScreen.classList.add("hidden");
  clockScreen.classList.remove("hidden");
  render();
};

pauseBtn.onclick = () => {
  togglePause();
  render();
};

soundBtn.onclick = () => {
  tickEnabled = !tickEnabled;
  render();
};

resetBtn.onclick = () => {
  resetGame();
  startGame();
  render();
};

settingsBtn.onclick = () => {
  if (confirm("Return to settings? Current game will be lost.")) {
    clockScreen.classList.add("hidden");
    settingsScreen.classList.remove("hidden");
    resetGame();
  }
};

fullscreenBtn.onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    document.body.classList.add('fullscreen');
  } else {
    document.exitFullscreen();
    document.body.classList.remove('fullscreen');
  }
};

viewStatsBtn.onclick = () => {
  settingsScreen.classList.add("hidden");
  statsScreen.classList.remove("hidden");
  renderStats();
};

backToSettingsBtn.onclick = () => {
  statsScreen.classList.add("hidden");
  settingsScreen.classList.remove("hidden");
};

clearStatsBtn.onclick = () => {
  if (confirm("Clear all statistics? This cannot be undone.")) {
    localStorage.removeItem('chessClockStats');
    renderStats();
  }
};

clockA.onclick = () => {
  if (gameState.isGameOver) return;
  
  if (!gameState.isRunning && gameState.turn === null) {
    return;
  } else if (gameState.turn === "B") {
    switchTurn();
  }
  render();
};

clockB.onclick = () => {
  if (gameState.isGameOver) return;
  
  if (!gameState.isRunning && gameState.turn === null) {
    gameState.turn = "A";
    startGame();
  } else if (gameState.turn === "A") {
    switchTurn();
  }
  render();
};

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (!settingsScreen.classList.contains("hidden") || !instructionScreen.classList.contains("hidden") || !statsScreen.classList.contains("hidden")) return;
  
  const leftKeys = ["1", "2", "3", "q", "w", "e", "a", "s", "d"];
  const rightKeys = ["8", "9", "0", "i", "o", "p", "k", "l", ";"];
  
  // Enter key switches turn
  if (e.key === "Enter") {
    e.preventDefault();
    if (gameState.turn === "A") {
      clockB.click();
    } else if (gameState.turn === "B") {
      clockA.click();
    } else if (gameState.turn === null) {
      clockB.click(); // Start game
    }
  } else if (gameState.settings.useSpacebar && e.key === " ") {
    e.preventDefault();
    if (gameState.turn === "A") {
      clockB.click();
    } else if (gameState.turn === "B") {
      clockA.click();
    }
  } else if (leftKeys.includes(e.key.toLowerCase()) && gameState.turn === "A") {
    clockB.click();
  } else if (rightKeys.includes(e.key.toLowerCase()) && gameState.turn === "B") {
    clockA.click();
  }
});

// Fullscreen change handler
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    document.body.classList.remove('fullscreen');
  }
});

// ===============================
// Game Loop
// ===============================
function gameLoop() {
  tick();
  render();
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();