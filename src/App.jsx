import { useState, useEffect } from 'react'
import { GridCell } from './GridCell.jsx'
import { EdgeCell } from './EdgeCell.jsx'
import { CornerCell } from './CornerCell.jsx'
import { getInfo } from './getInfo.jsx'
import './App.css'

export default function App() {
  
  // State
  const [gameID, setGameID] = useState(-1);
  const [gameBoard, setGameBoard] = useState([[]]);
  const [guesses, setGuesses] = useState([]);
  const [edges, setEdges] = useState(() => Array(32).fill(0));
  const [numExits, setNumExits] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Define constants
  const GAME_WIDTH = 10;
  const GAME_HEIGHT = 10;
  const NUM_CELLS = GAME_WIDTH * GAME_HEIGHT;
  const BOARD_WIDTH = GAME_WIDTH - 2;
  const BOARD_HEIGHT = GAME_HEIGHT - 2;
  const NUM_GUESSES = 4;
  const MISSED_PENALTY = 5;

  // Define sound effects
  const CLICK_SOUND = new Audio("assets/sound/click.m4a");
  const DETOUR_SOUND = new Audio("assets/sound/detour.m4a");
  const END_THEME_SOUND = new Audio("assets/sound/end_theme.m4a");
  const ERROR_SOUND = new Audio("assets/sound/error.m4a");
  const HIT_SOUND = new Audio("assets/sound/hit.m4a");
  const REFLECTION_SOUND = new Audio("assets/sound/reflection.m4a");
  const SELECT_SOUND = new Audio("assets/sound/select.m4a");
  const UNSELECT_SOUND = new Audio("assets/sound/unselect.m4a");

  // API call functions
  async function fetchGameID() {
    CLICK_SOUND.play();
    const gameIDData = await getInfo({ action: "getRandomGame" });
    setGameID(gameIDData.game);
  }
  async function fetchGameBoard() {
    let gameBoardData = await getInfo({ action: "gameBoard", boardID: gameID });
    transpose(gameBoardData);
    setGameBoard(gameBoardData);
  }
  async function castRay(position) {
    return await getInfo({ action: "castRay", boardID: gameID, position: position });
  }

  // Other functions
  function makeGuess() {
    if (!gameOver) {
      if (guesses.length != NUM_GUESSES) {
        ERROR_SOUND.play();
      }
      else {
        END_THEME_SOUND.play();
        let numMissed = getNumMissed();
        let points = numMissed * MISSED_PENALTY;
        setScore(score + points);
        setGameOver(true);
      }
    }
  }
  function getNumMissed() {
    let numMissed = 0;
    for (let i = 0; i < BOARD_HEIGHT; i++) {
      for (let j = 0; j < BOARD_WIDTH; j++) {
        let gameIndex = boardIndexToGameIndex(i, j);
        if (gameBoard[i][j] == 1 && !guesses.includes(gameIndex)) {
          numMissed += 1;
        }
      }
    }
    return numMissed;
  }
  function gameIndexToBoardIndex(gameIndex) {
    let rowIndex = Math.floor((gameIndex - GAME_WIDTH) / GAME_WIDTH);
    let columnIndex = (gameIndex - 1) % GAME_WIDTH;
    return [rowIndex, columnIndex];
  }
  function boardIndexToGameIndex(rowIndex, columnIndex) {
    return ((rowIndex * GAME_WIDTH) + GAME_WIDTH) + columnIndex + 1;
  }
  function gameIndexToEdgeIndex(gameIndex) {
    let rowIndex = Math.floor(gameIndex / GAME_WIDTH);
    let columnIndex = gameIndex % GAME_WIDTH;
    if (rowIndex == 0) {
      return columnIndex - 1;
    }
    else if (columnIndex == GAME_WIDTH - 1) {
      return rowIndex + GAME_WIDTH - 3;
    }
    else if (rowIndex == GAME_HEIGHT - 1) {
      return (GAME_WIDTH - 2) + (GAME_HEIGHT - 2) + (GAME_WIDTH - columnIndex - 2);
    }
    else {
      return 32 - rowIndex;
    }
  }
  function resetGameState() {
    fetchGameBoard();
    setGuesses([]);
    setEdges(Array(32).fill(0));
    setNumExits(0);
    setScore(0);
    setGameOver(false);
  }
  function transpose(matrix) {
    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix[i].length; j++) {
        const temp = matrix[i][j];
        matrix[i][j] = matrix[j][i];
        matrix[j][i] = temp;
      }
    }
  }
  async function handleEdgeClick(index) {
    if (gameID > -1 && !gameOver && edges[index] == 0) {
      let rayInfo = await castRay(index);
      if (rayInfo.error) {
        console.log(`Error fetching ray: ${rayInfo.error}`);
        return;
      }
      let newEdges = [...edges];
      let points = 1;
      rayInfo = rayInfo.exit;
      if (rayInfo == "H") {
        HIT_SOUND.play();
        newEdges[index] = "H";
      }
      else if (rayInfo == "R") {
        REFLECTION_SOUND.play();
        newEdges[index] = "R";
      }
      else {
        DETOUR_SOUND.play();
        points = 2;
        newEdges[index] = numExits + 1;
        newEdges[rayInfo] = numExits + 1;
        setNumExits(numExits + 1);
      }
      setScore(score + points);
      setEdges(newEdges);
    }
  }
  function handleGridClick(index) {
    if (gameID > -1 && !gameOver) {
      let newGuesses = [...guesses];
      if (guesses.includes(index)) {
        UNSELECT_SOUND.play();
        newGuesses.splice(newGuesses.indexOf(index), 1);
      }
      else if (guesses.length >= NUM_GUESSES) {
        ERROR_SOUND.play();
        return;
      }
      else {
        SELECT_SOUND.play();
        newGuesses.push(index);
      }
      setGuesses(newGuesses);
    }
  }
  function getEdgeType(edgeIndex) {
    let type = 0;
    if (edges[edgeIndex] == "H") {
      type = 3;
    }
    else if (edges[edgeIndex] == "R") {
      type = 2;
    }
    else if (edges[edgeIndex] != 0) {
      type = 1;
    }
    return type;
  }
  function getCellType(index) {
    let type = 0;
    let guessed = (guesses && guesses.includes(index)) ? true : false;
    let boardIndices = gameIndexToBoardIndex(index);
    let isBall = (gameBoard?.[boardIndices[0]]?.[boardIndices[1]] == 1) ? true : false;
    
    if (guessed && gameOver && isBall) {
      type = 2;
    }
    else if (guessed && gameOver && !isBall) {
      type = 3;
    }
    else if (guessed && !gameOver) {
      type = 1;
    }
    else if (!guessed && gameOver && isBall) {
      type = 4;
    }
    return type;
  }
  function quitGame() {
    CLICK_SOUND.play();
    setGameID(-1);
  }

  // Hooks
  useEffect(() => {
    resetGameState();
  }, [gameID]);

  // Create the game board
  let gameCells = [];
  for (let i = 0; i < NUM_CELLS; i++) {
    if (i == 0 || i == GAME_WIDTH - 1 || i == NUM_CELLS - 1 || i == NUM_CELLS - GAME_WIDTH) {
      gameCells.push(<CornerCell key={i}></CornerCell>);
    }
    else if (i % GAME_WIDTH == 0 || i % GAME_WIDTH == GAME_WIDTH - 1 || i < GAME_WIDTH || i > NUM_CELLS - GAME_WIDTH) {
      let edgeIndex = gameIndexToEdgeIndex(i);
      let type = getEdgeType(edgeIndex);
      let iconNumber = (type == 1) ? edges[edgeIndex] : 0;
      gameCells.push(<EdgeCell key={i} type={type} index={edgeIndex} iconNumber={iconNumber} onClick={() => handleEdgeClick(edgeIndex)}></EdgeCell>);
    }
    else {
      let type = getCellType(i);
      gameCells.push(<GridCell key={i} type={type} onClick={() => handleGridClick(i)}></GridCell>);
    }
  }

  // Return the SPA
  return (
    <div id="whole-page">
      <div id="title-card">
        <h1>Blackbox</h1>
        <h3>by Rex Norvell</h3>
      </div>
      <div id="game-info">
        {gameID > -1 && (
          <>
            <h2>Board ID: {gameID}</h2>
            <h2>Score: {score}</h2>
            {!gameOver && <button onClick={quitGame}>Quit Game</button>}
            {!gameOver && <button onClick={makeGuess}>Submit</button>}
          </>
        )}
        {(gameID == -1 || gameOver) && <button onClick={fetchGameID}>New Game</button>}
      </div>
      {gameID > -1 && <div id="game-grid">{gameCells}</div>}
    </div>
  )
}