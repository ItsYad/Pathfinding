const ROWS = 20;
const COLS = 40;
let grid = [];
let startNode = { row: 10, col: 5 };
let endNode = { row: 10, col: 35 };
let isMouseDown = false;
let isRunning = false;
let currentMode = "wall"; // wall, start, end

// Initialize Grid
function initGrid() {
  const gridElement = document.getElementById("grid");
  gridElement.style.gridTemplateColumns = `repeat(${COLS}, 25px)`;
  gridElement.innerHTML = "";
  grid = [];

  for (let row = 0; row < ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < COLS; col++) {
      const cell = {
        row,
        col,
        isStart: row === startNode.row && col === startNode.col,
        isEnd: row === endNode.row && col === endNode.col,
        isWall: false,
        isVisited: false,
        distance: Infinity,
        parent: null,
      };
      grid[row][col] = cell;

      const cellElement = document.createElement("div");
      cellElement.className = "cell";
      cellElement.id = `cell-${row}-${col}`;

      if (cell.isStart) cellElement.classList.add("start");
      if (cell.isEnd) cellElement.classList.add("end");

      cellElement.addEventListener("mousedown", () =>
        handleMouseDown(row, col)
      );
      cellElement.addEventListener("mouseenter", () =>
        handleMouseEnter(row, col)
      );
      cellElement.addEventListener("mouseup", () => handleMouseUp());

      gridElement.appendChild(cellElement);
    }
  }
}

// Mouse Event Handlers
function handleMouseDown(row, col) {
  if (isRunning) return;
  isMouseDown = true;
  handleCellClick(row, col);
}

function handleMouseEnter(row, col) {
  if (!isMouseDown || isRunning) return;
  handleCellClick(row, col);
}

function handleMouseUp() {
  isMouseDown = false;
}

function handleCellClick(row, col) {
  const cell = grid[row][col];

  if (currentMode === "wall") {
    if (cell.isStart || cell.isEnd) return;
    toggleWall(row, col);
  } else if (currentMode === "start") {
    moveStartNode(row, col);
  } else if (currentMode === "end") {
    moveEndNode(row, col);
  }
}

function toggleWall(row, col) {
  const cell = grid[row][col];
  cell.isWall = !cell.isWall;
  const cellElement = document.getElementById(`cell-${row}-${col}`);
  cellElement.classList.toggle("wall");
}

function moveStartNode(row, col) {
  const cell = grid[row][col];
  if (cell.isEnd || cell.isWall) return;

  // Remove old start
  const oldStart = grid[startNode.row][startNode.col];
  oldStart.isStart = false;
  document
    .getElementById(`cell-${startNode.row}-${startNode.col}`)
    .classList.remove("start");

  // Set new start
  startNode = { row, col };
  cell.isStart = true;
  document.getElementById(`cell-${row}-${col}`).classList.add("start");
}

function moveEndNode(row, col) {
  const cell = grid[row][col];
  if (cell.isStart || cell.isWall) return;

  // Remove old end
  const oldEnd = grid[endNode.row][endNode.col];
  oldEnd.isEnd = false;
  document
    .getElementById(`cell-${endNode.row}-${endNode.col}`)
    .classList.remove("end");

  // Set new end
  endNode = { row, col };
  cell.isEnd = true;
  document.getElementById(`cell-${row}-${col}`).classList.add("end");
}

// Visualization
async function visualize() {
  if (isRunning) return;
  isRunning = true;
  clearPath();

  const algorithm = document.getElementById("algorithmSelect").value;
  const startTime = performance.now();

  let visitedNodesInOrder;
  if (algorithm === "bfs") {
    visitedNodesInOrder = bfs();
  } else {
    visitedNodesInOrder = dijkstra();
  }

  await animateAlgorithm(visitedNodesInOrder);

  const shortestPath = getShortestPath();
  await animatePath(shortestPath);

  const endTime = performance.now();
  document.getElementById("visitedCount").textContent =
    visitedNodesInOrder.length;
  document.getElementById("pathLength").textContent = shortestPath.length;
  document.getElementById("executionTime").textContent =
    Math.round(endTime - startTime) + "ms";

  isRunning = false;
}

// BFS Algorithm
function bfs() {
  const visitedNodesInOrder = [];
  const queue = [];
  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];

  start.distance = 0;
  queue.push(start);

  while (queue.length > 0) {
    const currentNode = queue.shift();

    if (currentNode.isWall || currentNode.isVisited) continue;

    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);

    if (currentNode === end) break;

    const neighbors = getNeighbors(currentNode);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        neighbor.distance = currentNode.distance + 1;
        neighbor.parent = currentNode;
        queue.push(neighbor);
      }
    }
  }

  return visitedNodesInOrder;
}

// Dijkstra's Algorithm
function dijkstra() {
  const visitedNodesInOrder = [];
  const unvisitedNodes = [];
  const start = grid[startNode.row][startNode.col];
  const end = grid[endNode.row][endNode.col];

  start.distance = 0;

  for (let row of grid) {
    for (let node of row) {
      unvisitedNodes.push(node);
    }
  }

  while (unvisitedNodes.length > 0) {
    unvisitedNodes.sort((a, b) => a.distance - b.distance);
    const currentNode = unvisitedNodes.shift();

    if (currentNode.isWall) continue;
    if (currentNode.distance === Infinity) break;

    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);

    if (currentNode === end) break;

    const neighbors = getNeighbors(currentNode);
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && !neighbor.isWall) {
        const distance = currentNode.distance + 1;
        if (distance < neighbor.distance) {
          neighbor.distance = distance;
          neighbor.parent = currentNode;
        }
      }
    }
  }

  return visitedNodesInOrder;
}

// Helper Functions
function getNeighbors(node) {
  const neighbors = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < COLS - 1) neighbors.push(grid[row][col + 1]);

  return neighbors;
}

function getShortestPath() {
  const path = [];
  let currentNode = grid[endNode.row][endNode.col];

  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = currentNode.parent;
  }

  return path;
}

// Animation Functions
async function animateAlgorithm(visitedNodesInOrder) {
  for (let i = 0; i < visitedNodesInOrder.length; i++) {
    const node = visitedNodesInOrder[i];
    if (node.isStart || node.isEnd) continue;

    await new Promise((resolve) => setTimeout(resolve, 10));
    document
      .getElementById(`cell-${node.row}-${node.col}`)
      .classList.add("visited");
  }
}

async function animatePath(path) {
  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    if (node.isStart || node.isEnd) continue;

    await new Promise((resolve) => setTimeout(resolve, 50));
    document
      .getElementById(`cell-${node.row}-${node.col}`)
      .classList.add("path");
  }
}

// Clear Functions
function clearPath() {
  for (let row of grid) {
    for (let node of row) {
      node.isVisited = false;
      node.distance = Infinity;
      node.parent = null;

      const cellElement = document.getElementById(
        `cell-${node.row}-${node.col}`
      );
      cellElement.classList.remove("visited", "path");
    }
  }

  document.getElementById("visitedCount").textContent = "0";
  document.getElementById("pathLength").textContent = "0";
  document.getElementById("executionTime").textContent = "0ms";
}

function clearWalls() {
  if (isRunning) return;
  for (let row of grid) {
    for (let node of row) {
      if (node.isWall) {
        node.isWall = false;
        document
          .getElementById(`cell-${node.row}-${node.col}`)
          .classList.remove("wall");
      }
    }
  }
}

function resetAll() {
  if (isRunning) return;
  startNode = { row: 10, col: 5 };
  endNode = { row: 10, col: 35 };
  initGrid();
  document.getElementById("visitedCount").textContent = "0";
  document.getElementById("pathLength").textContent = "0";
  document.getElementById("executionTime").textContent = "0ms";
}

// Event Listeners
document.getElementById("startBtn").addEventListener("click", visualize);
document.getElementById("clearPathBtn").addEventListener("click", clearPath);
document.getElementById("clearWallsBtn").addEventListener("click", clearWalls);
document.getElementById("resetBtn").addEventListener("click", resetAll);

document.addEventListener("mouseup", () => {
  isMouseDown = false;
});

// Mode Selection
document.querySelectorAll('input[name="mode"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    currentMode = e.target.value;
  });
});

// Modal Functions
function openModal(modalId) {
  document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

document.getElementById("howToUseBtn").addEventListener("click", () => {
  openModal("howToUseModal");
});

document.getElementById("aboutBtn").addEventListener("click", () => {
  openModal("aboutModal");
});

document.querySelectorAll(".close").forEach((closeBtn) => {
  closeBtn.addEventListener("click", (e) => {
    const modalId = e.target.getAttribute("data-modal");
    closeModal(modalId);
  });
});

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
});

// Initialize
initGrid();
