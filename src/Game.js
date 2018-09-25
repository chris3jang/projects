import React, { Component } from 'react';
import TTT from './TTT';
import './Game.css';

import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:8080');

class Game extends Component {

	state = {
		turn: null,
		boardpositions: [
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
      [ " ", " ", " ", " ", " ", " ", " ", " ", " " ]
    ],
    outerboard: [ " ", " ", " ", " ", " ", " ", " ", " ", " " ],
    availableBoard: 9,
    allBoards: false,
    playerJustWonInnerBox: false,
    playerJustWonGame: false,
    waitingForOnlineOpponent: null
	};

  isBoardBlank() {
    for(let i=0; i < 9; i++) {
      for(let j=0; j < 9; j++) {
        if(this.state.boardpositions[i][j] !== " ") {
          return false;
        }
      }
    }
    return true;
  }

  determineHeading() {
    const {turn, playerJustWonInnerBox, playerJustWonGame} = this.state

    if(!this.props.roomID) {
      let innerboxwinner = " "

      if(playerJustWonInnerBox) {
        innerboxwinner = (!turn ? "X" : "O") + " Player wins a board. "
        console.log(innerboxwinner)
      }

      if(playerJustWonGame) {
        return (!turn ? "X" : "O") + " wins the game!"
      }

      if(turn === null) {
        return "";
      }
      else if(turn) {
        return innerboxwinner + "X Player's turn"
      }
      else return innerboxwinner + "O Player's turn"
    }
    else {
      console.log("DETERMINEHEADING")
      let innerboxwinner = " "
      if(playerJustWonInnerBox) {
        innerboxwinner = (turn ? "You win" : "Your opponent wins") + " a board. "
      }
      if(playerJustWonGame) {
        return (this.state.waitingForOnlineOpponent ? "You win" : "Your opponent wins") + "  the game!"
      }

      if(!this.props.newGameHasStarted) {
        return "";
      }
      else if(!this.state.waitingForOnlineOpponent) {
        return innerboxwinner + "Your turn"
      }
      else return innerboxwinner + "Your opponent's turn"
    }
    
  }

  componentWillReceiveProps(nextProps) {
    const {newGameHasStarted} = nextProps
    if(newGameHasStarted && this.isBoardBlank() && this.props.newGameHasStarted != nextProps.newGameHasStarted) {
      this.setState({turn: true, allBoards: true})
    }
    if(nextProps.player == 1 || nextProps.player == 2) {
      console.log("PLAYER NUMBER SELECTED") 
      if(nextProps.player == 1 && nextProps.player != this.props.player) {
        this.setState({waitingForOnlineOpponent: false, room: this.props.roomID})
      }
      if(nextProps.player == 2 && nextProps.player != this.props.player) {
        this.setState({waitingForOnlineOpponent: true, room: this.props.roomID, turn: false}) 
      }
    }
    if(this.props.turnPlayedData != nextProps.turnPlayedData) {

      const move = nextProps.turnPlayedData.tile
      if(this.state.boardpositions[move[0]][move[1]] != (this.state.turn ? 'X' : 'O')) {
        this.handleOnlineOpponentsMove(nextProps.turnPlayedData.tile)
      }
      //this.setState({waitingForOnlineOpponent: false})
    }
  }


	handleMove(squareClicked) { //squareClicked is whatever is fed to position attribute in <Square/>
    console.log("squareClicked")
    if(this.props.roomID == null) this.handleLocalMove(squareClicked)
    if(this.props.roomID && !this.state.waitingForOnlineOpponent) this.handleOnlineMove(squareClicked)
  };











  //******************************************************************************************************

  handleLocalMove(squareClicked) { //squareClicked is whatever is fed to position attribute in <Square/>
    const {turn, boardpositions, availableBoard, allBoards} = this.state //these variables are undefined until this line, figure out why i put this line in this method and never in the constructor
    boardpositions[squareClicked[0]][squareClicked[1]] = turn ? 'X' : 'O'; //this line causes <Square/>'s content attribute to change immediately
    const currentBoard = boardpositions[squareClicked[0]]
    this.setState({turn: !turn, boardpositions}, this.didWin(currentBoard, squareClicked)); //these variables don't get updated until after this function is complete(they will be changed once this.state at the beginning of this function is called again), boardpositions same as "boardpostions: boardposition"
    
    //magic box check
    var aB = false
    for(var i=0; i<9; i++) {
      if(boardpositions[squareClicked[1]][i] === " ") {
        break;
      }
      else if(i === 8) {
        aB = true
      }
    }

    this.setState({availableBoard: squareClicked[1], allBoards: aB})

  };

  handleOnlineMove(squareClicked) {
    console.log("CURRENT PLAYERS MOVE")
    const {turn, boardpositions, availableBoard, allBoards} = this.state //these variables are undefined until this line, figure out why i put this line in this method and never in the constructor
    boardpositions[squareClicked[0]][squareClicked[1]] = turn ? 'X' : 'O'; //this line causes <Square/>'s content attribute to change immediately
    const currentBoard = boardpositions[squareClicked[0]]
    this.setState({boardpositions}, this.didWin(currentBoard, squareClicked)); //these variables don't get updated until after this function is complete(they will be changed once this.state at the beginning of this function is called again), boardpositions same as "boardpostions: boardposition"

    //magic box check
    let aB = false
    for(var i=0; i<9; i++) {
      if(boardpositions[squareClicked[1]][i] === " ") {
        break;
      }
      else if(i === 8) {
        aB = true
      }
    }
    this.setState({availableBoard: squareClicked[1], allBoards: aB})
    this.setState({waitingForOnlineOpponent: true})
    socket.emit('playTurn', { tile: squareClicked, room: this.props.roomID })

  }


  handleOnlineOpponentsMove(squareClicked) {
    console.log("OPPO MOVE")
    const {turn, boardpositions, availableBoard, allBoards} = this.state //these variables are undefined until this line, figure out why i put this line in this method and never in the constructor
    boardpositions[squareClicked[0]][squareClicked[1]] = turn ? 'O' : 'X'; //this line causes <Square/>'s content attribute to change immediately
    const currentBoard = boardpositions[squareClicked[0]]
    this.setState({boardpositions}, this.didWin(currentBoard, squareClicked)); //these variables don't get updated until after this function is complete(they will be changed once this.state at the beginning of this function is called again), boardpositions same as "boardpostions: boardposition"
    
    //magic box check
    let aB = false
    for(var i=0; i<9; i++) {
      if(boardpositions[squareClicked[1]][i] === " ") {
        break;
      }
      else if(i === 8) {
        aB = true
      }
    }

    this.setState({availableBoard: squareClicked[1], allBoards: aB, waitingForOnlineOpponent: false})
  }


  //***********************************************************************************************************************








  //***********************************************************************************************************************


  didWinBoard(board) {
    const winConditions = [ 
      [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6],
    ];
    for(var i=0; i<8; i++) {
      if(board[winConditions[i][0]] === board[winConditions[i][1]] && 
        board[winConditions[i][1]] === board[winConditions[i][2]] && 
        board[winConditions[i][1]] !== " ") {
        return true
      }
    }
    return false
  }

  didWin(board, squareClicked) {
    const {turn, boardpositions, outerboard, playerJustWonInnerBox} = this.state;
    const {gameSettings} = this.props
    if(this.didWinBoard(board)) {
      console.log("won an inner box");
      if(outerboard[squareClicked[0]] === ' ') {
        this.setState({playerJustWonInnerBox: true})
      }
      else {
        this.setState({playerJustWonInnerBox: false})
      }

      //online logic involved
      if(outerboard[squareClicked[0]] === " ") {
        //click square
        outerboard[squareClicked[0]] = !this.props.roomID ? (turn ? 'X' : 'O') : (!this.state.waitingForOnlineOpponent ? (turn ? 'X' : 'O') : (turn ? 'O' : 'X'));
      }

      if(gameSettings === "one") {
        this.wonGame();
      }
      else this.didWinGame();

    }
    else this.setState({playerJustWonInnerBox: false})

  }

  //check for win on outer board only when an inner box is won
  didWinGame() {
    if(this.didWinBoard(this.state.outerboard)) {
        this.wonGame();
      }
  }
  

  wonGame() {
    const {availableBoard, allBoards, playerJustWonGame} = this.state
    this.setState({availableBoard: 9, allBoards: false, playerJustWonGame: true})
  }

  //***********************************************************************************************************************





  isBoardBlank = this.isBoardBlank.bind(this);
  handleMove = this.handleMove.bind(this);
  didWin = this.didWin.bind(this);
  wonGame = this.wonGame.bind(this);

  handleOnlineOpponentsMove = this.handleOnlineOpponentsMove.bind(this)

  render() {
  	const {boardpositions, availableBoard, allBoards, outerboard, turn} = this.state
    console.log("allBoards: " + allBoards)
    return (
      <div id="Game">
      	<TTT 
      		boardset={false}
      		boardpositions={boardpositions}
      		myFunc={this.handleMove}
          availableBoard={availableBoard}
          allBoards={allBoards}
          outerboard={outerboard}>
      	</TTT>
        <h2>{this.determineHeading()}</h2>
      </div>
    );
  }
}

export default Game;
