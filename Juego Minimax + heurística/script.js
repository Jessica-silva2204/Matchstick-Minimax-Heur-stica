// script.js - Minimax + heurística para Matchstick Game
// Autor: proyecto educativo - limpio, modular y comentado

// ---------- Estado global ----------
const state = {
  sticks: 15,
  playerTurn: true,
  history: [],
  cache: new Map() // memoización para minimax
};

// ---------- Selectores ----------
const sticksContainer = document.getElementById('sticksContainer');
const sticksCount = document.getElementById('sticksCount');
const turnIndicator = document.getElementById('turnIndicator');
const heurText = document.getElementById('heurText');
const minimaxText = document.getElementById('minimaxText');
const suggestedMove = document.getElementById('suggestedMove');
const historyList = document.getElementById('historyList');
const startCount = document.getElementById('startCount');

const newGameBtn = document.getElementById('newGameBtn');
const take1 = document.getElementById('take1');
const take2 = document.getElementById('take2');
const take3 = document.getElementById('take3');
const showTable = document.getElementById('showTable');
const tableModal = document.getElementById('tableModal');
const closeTable = document.getElementById('closeTable');
const resultTableBody = document.querySelector('#resultTable tbody');
const resetHistoryBtn = document.getElementById('resetHistory');

// ---------- Heurística ----------
/**
 * Heurística simple (del enunciado):
 * devuelve 1 si palos % 4 == 0, en otro caso -1
 *
 * Nota: en este diseño 1 indica que la heurística marca el estado "clave" (múltiplo de 4).
 */
function evaluarEstado(palos) {
  return palos % 4 === 0 ? 1 : -1;
}

// ---------- Minimax con memoización ----------
/**
 * minimaxEval: devuelve el valor del estado (1 o -1)
 *   - palos: número de palos restantes
 *   - turnoMax: true si es el turno del jugador MAX (quien intenta maximizar)
 *
 * Convención de terminal: si palos === 0 entonces el jugador que acaba de mover
 *       hizo que no queden palos; según reglas, quien toma el último palo PIERDE.
 *       En la recursión aplicamos la convención usada en el enunciado:
 *         if palos == 0: return (-1 if turno_max else 1)
 */
function minimaxEval(palos, turnoMax) {
  const key = `${palos}-${turnoMax ? 1 : 0}`;
  if (state.cache.has(key)) return state.cache.get(key);

  if (palos === 0) {
    const result = turnoMax ? -1 : 1;
    state.cache.set(key, result);
    return result;
  }

  if (turnoMax) {
    // Maximizar
    let best = -Infinity;
    for (let mov = 1; mov <= 3; mov++) {
      if (palos - mov >= 0) {
        const val = minimaxEval(palos - mov, false);
        if (val > best) best = val;
        if (best === 1) break; // poda simple: no puedo mejorar
      }
    }
    state.cache.set(key, best);
    return best;
  } else {
    // Minimizar (oponente)
    let best = Infinity;
    for (let mov = 1; mov <= 3; mov++) {
      if (palos - mov >= 0) {
        const val = minimaxEval(palos - mov, true);
        if (val < best) best = val;
        if (best === -1) break;
      }
    }
    state.cache.set(key, best);
    return best;
  }
}

/**
 * minimaxMove: devuelve {score, move} para el jugador MAX en estado dado
 */
function minimaxMove(palos) {
  let bestMove = 1;
  let bestScore = -Infinity;
  for (let mov = 1; mov <= 3; mov++) {
    if (palos - mov >= 0) {
      const score = minimaxEval(palos - mov, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = mov;
      }
    }
  }
  return { score: bestScore, move: bestMove };
}

// ---------- UI / render ----------
function renderSticks() {
  sticksContainer.innerHTML = '';
  for (let i = 0; i < state.sticks; i++) {
    const d = document.createElement('div');
    d.className = 'stick';
    // add slight randomness to spacing for natural look
    d.style.transform = `translateY(0) rotate(${(i % 5) - 2}deg)`;
    sticksContainer.appendChild(d);
  }
  sticksCount.textContent = state.sticks;
  heurText.textContent = `Heurística (palos % 4 == 0) = ${evaluarEstado(state.sticks)}`;
  const minimaxVal = minimaxEval(state.sticks, true);
  minimaxText.textContent = `Minimax eval = ${minimaxVal}`;
  const suggested = minimaxMove(state.sticks);
  suggestedMove.textContent = `${suggested.move} (score: ${suggested.score})`;
  turnIndicator.textContent = state.playerTurn ? 'Turno: Humano' : 'Turno: IA';
  updateHistoryUI();
  updateControls();
}

function updateControls() {
  // Habilitar/Deshabilitar botones según turno
  const disabled = !state.playerTurn;
  take1.disabled = disabled || state.sticks < 1;
  take2.disabled = disabled || state.sticks < 2;
  take3.disabled = disabled || state.sticks < 3;

  // estilo disabled
  [take1, take2, take3].forEach(btn => btn.style.opacity = btn.disabled ? '0.5' : '1');
}

function updateHistoryUI() {
  historyList.innerHTML = '';
  for (let i = state.history.length - 1; i >= 0; i--) {
    const item = state.history[i];
    const li = document.createElement('li');
    li.textContent = `${item.turn}: ${item.actor} tomó ${item.move} → palos = ${item.result}`;
    historyList.appendChild(li);
  }
}

// ---------- Juego: movimientos ----------
function playerTake(n) {
  if (!state.playerTurn || n < 1 || n > 3 || n > state.sticks) return;
  applyMove('Humano', n);
  if (checkEnd('Humano')) return;
  // IA responde con pequeña demora para animación
  setTimeout(() => {
    aiTurn();
  }, 600);
}

function aiTurn() {
  state.playerTurn = false;
  renderSticks();
  // IA calcula movimiento (Minimax)
  const { move } = minimaxMove(state.sticks);
  // si por alguna razón move > sticks, corregir
  const actualMove = Math.min(move, Math.max(1, Math.min(3, state.sticks)));
  // animación de "toma" (delay)
  setTimeout(() => {
    applyMove('IA', actualMove);
    if (!checkEnd('IA')) {
      state.playerTurn = true;
      renderSticks();
    }
  }, 450);
}

function applyMove(actor, n) {
  state.sticks -= n;
  state.history.push({ turn: state.history.length + 1, actor, move: n, result: state.sticks });
  // animate: mark last n sticks as taken
  animateTaken(n);
  renderSticks();
}

function animateTaken(n) {
  // add class 'taken' to last n stick elements to show animation
  const sticksElems = Array.from(sticksContainer.children);
  const last = sticksElems.slice(-n);
  last.forEach((el, idx) => {
    setTimeout(() => el.classList.add('taken'), idx * 60);
  });
}

// ---------- Comprobación fin de juego ----------
function checkEnd(actor) {
  if (state.sticks === 0) {
    // El que tomó el último palo PIERDE
    const loser = actor;
    const winner = actor === 'Humano' ? 'IA' : 'Humano';
    setTimeout(() => {
      alert(`Partida finalizada.\n${loser} tomó el último palo y PIERDE.\nGanador: ${winner}`);
    }, 50);
    // bloquear botones
    state.playerTurn = false;
    renderSticks();
    return true;
  }
  return false;
}

// ---------- Controladores UI ----------
newGameBtn.addEventListener('click', () => {
  const val = parseInt(startCount.value, 10) || 15;
  startNewGame(Math.max(5, Math.min(50, val)));
});

take1.addEventListener('click', () => playerTake(1));
take2.addEventListener('click', () => playerTake(2));
take3.addEventListener('click', () => playerTake(3));

showTable.addEventListener('click', () => {
  renderTable();
  tableModal.classList.remove('hidden');
});
closeTable.addEventListener('click', () => tableModal.classList.add('hidden'));
resetHistoryBtn.addEventListener('click', () => {
  state.history = [];
  updateHistoryUI();
});

// Iniciar nueva partida
function startNewGame(start = 15) {
  state.sticks = start;
  state.playerTurn = document.querySelector('input[name="starter"]:checked').value === 'player';
  state.history = [];
  state.cache.clear();
  renderSticks();
  // si IA comienza
  if (!state.playerTurn) {
    setTimeout(() => aiTurn(), 500);
  }
}

// Mostrar tabla heurística vs minimax para 1..20
function renderTable() {
  resultTableBody.innerHTML = '';
  state.cache.clear(); // limpiar caché antes de calcular para consistencia
  for (let i = 1; i <= 20; i++) {
    const heur = evaluarEstado(i);
    const mini = minimaxEval(i, true);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}</td><td>${heur}</td><td>${mini}</td>`;
    resultTableBody.appendChild(tr);
  }
}

// ---------- Inicialización ----------
startNewGame(parseInt(startCount.value, 10));
