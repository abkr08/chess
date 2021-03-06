import React, { Component } from "react";
import Grid from "./Grid.js";
import io from 'socket.io-client'; //I had to install it using npm i. We could've used a cdn if we wanted

const socket = io('ide50-gotzil8.cs50.io:8082'); //Just initializing socket with the address our server(socket.io) is listening on. Ok come to componentDidMount
class Main extends Component {
  constructor() {
    super();
    this.state = {
      units: Array(8)
        .fill()
        .map(() => Array(8).fill(null)),
      highlighted: Array(8)
        .fill()
        .map(() => Array(8).fill(false)),
      currTurn: "W",
      boxSelected: [], 
      isTurn: true
    };
  }

  newGame = () => {
    let unitsArr = Array(8)
      .fill()
      .map(() => Array(8).fill(null));

    for (let i = 0; i < 8; i++) {
      unitsArr[1][i] = "B_Pawn";
      unitsArr[6][i] = "W_Pawn";
    }

    unitsArr[0][4] = "B_King";
    unitsArr[0][0] = "B_Rook";
    unitsArr[0][7] = "B_Rook";
    unitsArr[0][1] = "B_Knight";
    unitsArr[0][6] = "B_Knight";
    unitsArr[0][2] = "B_Bishop";
    unitsArr[0][5] = "B_Bishop";
    unitsArr[0][3] = "B_Queen";
    unitsArr[7][4] = "W_King";
    unitsArr[7][0] = "W_Rook";
    unitsArr[7][7] = "W_Rook";
    unitsArr[7][1] = "W_Knight";
    unitsArr[7][6] = "W_Knight";
    unitsArr[7][2] = "W_Bishop";
    unitsArr[7][5] = "W_Bishop";
    unitsArr[7][3] = "W_Queen";
    this.setState({ units: unitsArr });
  };

  componentDidMount() {
    this.newGame();
    //socket.emit('connected', this.state.units); //It emits to the server that we are connected..we are not actually handling this on the server. We can delete it
    //. If you notice, there is no socket.on('connected') on the server.js file
    // oh. So why are we passing this.state.units? No reason. I think I wrote it initially and forgot to delete it...
    //console.log(socket);
    socket.on('on move made', data => { //This handles the emission from the server when an opponent makes a move
    // So in socket, socket.emit is like emitting the event and socket.on is like handling the emitted event? Exactly. Line 130 is where we actually emit the moves
      const { units, turn, isTurn } = data;
      this.setState({units: units, currTurn: turn, isTurn: isTurn});
   })
   socket.on('new game', () => {
     this.newGame();
   })
   //Now use the above function as an example to react to the new game event
   //Nice. Now let's go the server 
   // I think this should work.
   //OK. server.js file in the chess_backend folder
  }
  
  unHighlight = (i, j) => {
    // All boxes except i,j are unhighlighted
    let newArr = Array(8)
      .fill()
      .map(() => Array(8).fill(false));
    newArr[i][j] = true;
    return newArr;
  };

  handleSelect = (i, j) => {
    let highlightedClone = arrayClone(this.state.highlighted);
    let boxSelected = arrayClone(this.state.boxSelected);
    if (boxSelected.length === 0) boxSelected.push([i, j]);
    if (boxSelected.length > 1) boxSelected.shift();
    boxSelected.push([i, j]);
    this.setState({ boxSelected });
    highlightedClone = this.unHighlight(i, j);
    // Clicking any other box removes all prior highlighting.
    const unit = this.state.units[i][j].split("_")[1];
    this.setState({ highlighted: highlightedClone, boxSelected: boxSelected });
    
    switch (unit) {
      case "Pawn":
        this.pawn(i, j, highlightedClone);
        break;
      case "Rook":
        this.rook(i, j, highlightedClone);
        break;
      case "Knight":
        this.knight(i, j, highlightedClone);
        break;
      case "Bishop": 
        this.bishop(i, j, highlightedClone);
        break;
      case "Queen":
        this.queen(i, j, highlightedClone);
        break;
      case 'King':
        this.king(i, j, highlightedClone);
        break;
    }
  };
  

  moveUnit = (i, j) => {
    let highlightedClone = this.unHighlight(i, j);
    highlightedClone[i][j] = false;
    let boxSelected = arrayClone(this.state.boxSelected);
    let unitsClone = arrayClone(this.state.units);
    const prevX = parseInt(boxSelected[1][0]);
    const prevY = parseInt(boxSelected[1][1]);
    if (i === prevX && j === prevY) return;
    if (boxSelected.length > 1) boxSelected.shift();
    boxSelected.push([i, j]);
    const unit = unitsClone[prevX][prevY];
    const unitOnBox = unitsClone[i][j];
    if (unitOnBox !== null) {
      if (unitOnBox.split("_")[1] === "King") {
        socket.emit('new game'); //Do I add something on the second argument?//I don't think that is necessary
        // Wait. Does socket store data?
        // The data it emits to all the clients.. does it store it somewhere? no
        //Now you you need to handle this emission on the server 
        // What I want to do is send the new unitsArr to all the clients on the server.
        // How do I send data?
        // you send them as arguments beside the event's name. but that won't be necessary since you are just going to call this.newGame(). Yes. So how do I trigger the client's computer to call the function? In componentDidMount, we handled opponent's moves remember? We can do the same now. Let's go there...
        this.newGame();
        this.setState({
          highlighted: Array(8)
            .fill()
            .map(() => Array(8).fill(false))
        });
        return;
      }
    }
    unitsClone[i][j] = unit;
    unitsClone[prevX][prevY] = null;
    let turn = this.state.currTurn;
    if (turn === "W") turn = "B";
    else turn = "W";
    this.setState({
      units: unitsClone,
      currTurn: turn,
      boxSelected,
      isTurn: false,
      highlighted: highlightedClone
    });
    socket.emit('on move made', {
      units: unitsClone,
      turn: turn,
      isTurn: true,
    });
    
    //Got it? immediately after a player makes a move, we send it to the other player
    //Yeah. That's really good. Yeah... and the last lines... let's go there. Which one? 
    //line 765
  };

  pawn = (i, j, highlightedClone) => {
    const unitsClone = arrayClone(this.state.units);
    const turn = this.state.currTurn;
    if (turn === "W") {
      // if turn is white, pawns move above.
      if (unitsClone[i - 1][j] === null) {
        highlightedClone[i - 1][j] = true; //Highlighting the box below the pawn.
        if (i === 6 && unitsClone[i - 2][j] === null)
          highlightedClone[i - 2][j] = true;
      }

      if (j > 0) {
        let left = unitsClone[i - 1][j - 1];
        if (left !== null) {
          let leftUnitColor = left.split("_")[0];
          if (leftUnitColor === "B") highlightedClone[i - 1][j - 1] = true;
        }
      }
      if (j < 7) {
        let right = unitsClone[i - 1][j + 1];
        if (right !== null) {
          let rightUnitColor = right.split("_")[0];
          if (rightUnitColor === "B") highlightedClone[i - 1][j + 1] = true;
        }
      }
    }

    if (turn === "B") {
      // if turn is black, pawns move below.
      if (unitsClone[i + 1][j] === null) {
        highlightedClone[i + 1][j] = true; //Highlighting the box above the pawn.
        if (i === 1 && unitsClone[i + 2][j] === null)
          highlightedClone[i + 2][j] = true;
      }

      if (j > 0) {
        let left = unitsClone[i + 1][j - 1];
        if (left !== null) {
          let leftUnitColor = left.split("_")[0];
          if (leftUnitColor === "W") highlightedClone[i + 1][j - 1] = true;
        }
      }
      if (j < 7) {
        let right = unitsClone[i + 1][j + 1];
        if (right !== null) {
          let rightUnitColor = right.split("_")[0];
          if (rightUnitColor === "W") highlightedClone[i + 1][j + 1] = true;
        }
      }
    }
    this.setState({ highlighted: highlightedClone });
  };

  rook = (i, j, highlightedClone) => {
   
    const unitsClone = arrayClone(this.state.units);
    const turn = this.state.currTurn;
      if (turn === "W") {
        if (i > 0){
          for (let r = i-1; r >= 0; r --){ //For boxes above the rook.
            let unit = unitsClone[r][j];
            if (unit === null) highlightedClone[r][j] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "B") { //unit[0] is the color of the unit.
                highlightedClone[r][j] = true;
                break;
              } else break;
            }
          }
        }
        if (i < 7){
          for (let r = i+1; r <= 7; r ++){ //For boxes above the rook.
            let unit = unitsClone[r][j];
            if (unit === null) highlightedClone[r][j] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "B") { //unit[0] is the color of the unit.
                highlightedClone[r][j] = true;
                break;
              } else break;
            }
          }
        }
        if (j > 0){
          for (let r = j-1; r >= 0; r --){ //For boxes left to the rook.
            let unit = unitsClone[i][r];
            if (unit === null) highlightedClone[i][r] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "B") { //unit[0] is the color of the unit.
                highlightedClone[i][r] = true;
                break;
              } else break;
            }
          }
        }
        if (j < 7){
          for (let r = j+1; r <= 7; r ++){ //For boxes right to the rook.
            let unit = unitsClone[i][r];
            if (unit === null) highlightedClone[i][r] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "B") { //unit[0] is the color of the unit.
                highlightedClone[i][r] = true;
                break;
              } else break;
            }
          }
        }
      }
      else {
        if (i > 0){
          for (let r = i-1; r >= 0; r --){ //For boxes above the rook.
            let unit = unitsClone[r][j];
            if (unit === null) highlightedClone[r][j] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "W") { //unit[0] is the color of the unit.
                highlightedClone[r][j] = true;
                break;
              } else break;
            }
          }
        }
        if (i < 7){
          for (let r = i+1; r <= 7; r ++){ //For boxes above the rook.
            let unit = unitsClone[r][j];
            if (unit === null) highlightedClone[r][j] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "W") { //unit[0] is the color of the unit.
                highlightedClone[r][j] = true;
                break;
              } else break;
            }
          }
        }
        if (j > 0){
          for (let r = j-1; r >= 0; r --){ //For boxes left to the rook.
            let unit = unitsClone[i][r];
            if (unit === null) highlightedClone[i][r] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "W") { //unit[0] is the color of the unit.
                highlightedClone[i][r] = true;
                break;
              } else break;
            }
          }
        }
        if (j < 7){
          for (let r = j+1; r <= 7; r ++){ //For boxes right to the rook.
            let unit = unitsClone[i][r];
            if (unit === null) highlightedClone[i][r] = true;
            else {
              unit = unit.split("_")
              if (unit[0] === "W") { //unit[0] is the color of the unit.
                highlightedClone[i][r] = true;
                break;
              } else break;
            }
          }
        }
      }
    this.setState({ highlighted: highlightedClone });

  }
  
  knight = (i, j, highlightedClone) => {
    const unitsClone = arrayClone(this.state.units);
    const turn = this.state.currTurn;
    if (turn === 'W'){
      // First of all, ahead.
      if (i >= 2) { //i has to be greater than 1 if the knight has to move ahead. because it moves 2 straight
      // and 1 in the other axis.
        if (j >= 1){
          let left = unitsClone[i - 2][j-1]
          if (left === null) highlightedClone[i-2][j-1] = true;
          else {
            left = left.split("_")
            if (left[0] === "B") highlightedClone[i-2][j-1] = true;
          }
        }
        if (j <= 6){
          let right = unitsClone[i - 2][j+1]
          if (right === null) highlightedClone[i-2][j+1] = true;
          else {
            right = right.split("_")
            if (right[0] === "B") highlightedClone[i-2][j+1] = true;
          }
        }
      }
      
      if (i <= 5) { //i has to be less than 6 if the knight has to move below. because it moves 2 straight
      // and 1 in the other axis.
        if (j >= 1){
          let left = unitsClone[i + 2][j-1]
          if (left === null) highlightedClone[i+2][j-1] = true;
          else {
            left = left.split("_")
            if (left[0] === "B") highlightedClone[i+2][j-1] = true;
          }
        }
        if (j <= 6){
          let right = unitsClone[i + 2][j+1]
          if (right === null) highlightedClone[i+2][j+1] = true;
          else {
            right = right.split("_")
            if (right[0] === "B") highlightedClone[i+2][j+1] = true;
          }
        }
      }
      
      if (j >= 2) { //i has to be greater than 1 if the knight has to move ahead. because it moves 2 straight
      // and 1 in the other axis.
        if (i >= 1){
          let left = unitsClone[i -1][j-2]
          if (left === null) highlightedClone[i-1][j-2] = true;
          else {
            left = left.split("_")
            if (left[0] === "B") highlightedClone[i-1][j-2] = true;
          }
        }
        if (i <= 6){
          let right = unitsClone[i +1][j-2]
          if (right === null) highlightedClone[i+1][j-2] = true;
          else {
            right = right.split("_")
            if (right[0] === "B") highlightedClone[i+1][j-2] = true;
          }
        }
      }
      
      if (j <= 5) { //i has to be less than 6 if the knight has to move below. because it moves 2 straight
      // and 1 in the other axis.
        if (i >= 1){
          let left = unitsClone[i -1][j+2]
          if (left === null) highlightedClone[i-1][j+2] = true;
          else {
            left = left.split("_")
            if (left[0] === "B") highlightedClone[i-1][j+2] = true;
          }
        }
        if (i <= 6){
          let right = unitsClone[i + 1][j+2]
          if (right === null) highlightedClone[i+1][j+2] = true;
          else {
            right = right.split("_")
            if (right[0] === "B") highlightedClone[i+1][j+2] = true;
          }
        }
      }
    } else {
      // First of all, ahead.
      if (i >= 2) { //i has to be greater than 1 if the knight has to move ahead. because it moves 2 straight
      // and 1 in the other axis.
        if (j >= 1){
          let left = unitsClone[i - 2][j-1]
          if (left === null) highlightedClone[i-2][j-1] = true;
          else {
            left = left.split("_")
            if (left[0] === "W") highlightedClone[i-2][j-1] = true;
          }
        }
        if (j <= 6){
          let right = unitsClone[i - 2][j+1]
          if (right === null) highlightedClone[i-2][j+1] = true;
          else {
            right = right.split("_")
            if (right[0] === "W") highlightedClone[i-2][j+1] = true;
          }
        }
      }
      
      if (i <= 5) { //i has to be less than 6 if the knight has to move below. because it moves 2 straight
      // and 1 in the other axis.
        if (j >= 1){
          let left = unitsClone[i + 2][j-1]
          if (left === null) highlightedClone[i+2][j-1] = true;
          else {
            left = left.split("_")
            if (left[0] === "W") highlightedClone[i+2][j-1] = true;
          }
        }
        if (j <= 6){
          let right = unitsClone[i + 2][j+1]
          if (right === null) highlightedClone[i+2][j+1] = true;
          else {
            right = right.split("_")
            if (right[0] === "W") highlightedClone[i+2][j+1] = true;
          }
        }
      }
      
      if (j >= 2) { //i has to be greater than 1 if the knight has to move ahead. because it moves 2 straight
      // and 1 in the other axis.
        if (i >= 1){
          let left = unitsClone[i -1][j-2]
          if (left === null) highlightedClone[i-1][j-2] = true;
          else {
            left = left.split("_")
            if (left[0] === "W") highlightedClone[i-1][j-2] = true;
          }
        }
        if (j <= 6){
          let right = unitsClone[i +1][j-2]
          if (right === null) highlightedClone[i+1][j-2] = true;
          else {
            right = right.split("_")
            if (right[0] === "W") highlightedClone[i+1][j-2] = true;
          }
        }
      }
      
      if (j <= 5) { //i has to be less than 6 if the knight has to move below. because it moves 2 straight
      // and 1 in the other axis.
        if (i >= 1){
          let left = unitsClone[i -1][j+2]
          if (left === null) highlightedClone[i-1][j+2] = true;
          else {
            left = left.split("_")
            if (left[0] === "W") highlightedClone[i-1][j+2] = true;
          }
        }
        if (i <= 6){
          let right = unitsClone[i + 1][j+2]
          if (right === null) highlightedClone[i+1][j+2] = true;
          else {
            right = right.split("_")
            if (right[0] === "W") highlightedClone[i+1][j+2] = true;
          }
        }
      }
    }
  }
  
  bishop = (i,j,highlightedClone) => { //bishop can move in 4 directions.
    const unitsClone = arrayClone(this.state.units);
    const turn = this.state.currTurn;
    if (turn === "W") {
      
        for (let r = 1; r < 8; r++) { // right top.
          if (i - r >= 0 && j + r <= 7){
            let unit = unitsClone[i-r][j+r];
            if (unit === null) highlightedClone[i-r][j+r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "B") {
                highlightedClone[i-r][j+r] = true;
                break;
              } else break;
            }
          }
        }
        
        for (let r = 1; r < 8; r++) { // right bottom.
          if (i + r <= 7 && j + r <= 7){
            let unit = unitsClone[i+r][j+r];
            if (unit === null) highlightedClone[i+r][j+r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "B") {
                highlightedClone[i+r][j+r] = true;
                break;
              } else break;
            }
          }
        }
        
        for (let r = 1; r < 8; r++) { // left bottom.
          if (i + r <= 7 && j - r >= 0){
            let unit = unitsClone[i+r][j-r];
            if (unit === null) highlightedClone[i+r][j-r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "B") {
                highlightedClone[i+r][j-r] = true;
                break;
              } else break;
            }
          }
        }
        
        for (let r = 1; r < 8; r++) { // left top.
          if (i - r >= 0 && j - r >= 0){
            let unit = unitsClone[i-r][j-r];
            if (unit === null) highlightedClone[i-r][j-r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "B") {
                highlightedClone[i-r][j-r] = true;
                break;
              } else break;
            }
          }
        }
        
    } else {
      
      for (let r = 1; r < 8; r++) { // right top.
          if (i - r >= 0 && j + r <= 7){
            let unit = unitsClone[i-r][j+r];
            if (unit === null) highlightedClone[i-r][j+r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "W") {
                highlightedClone[i-r][j+r] = true;
                break;
              } else break;
            }
          }
        }
        
        for (let r = 1; r < 8; r++) { // right bottom.
          if (i + r <= 7 && j + r <= 7){
            let unit = unitsClone[i+r][j+r];
            if (unit === null) highlightedClone[i+r][j+r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "W") {
                highlightedClone[i+r][j+r] = true;
                break;
              } else break;
            }
          }
        }
        
        for (let r = 1; r < 8; r++) { // left bottom.
          if (i + r <= 7 && j - r >= 0){
            let unit = unitsClone[i+r][j-r];
            if (unit === null) highlightedClone[i+r][j-r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "W") {
                highlightedClone[i+r][j-r] = true;
                break;
              } else break;
            }
          }
        }
        
        for (let r = 1; r < 8; r++) { // left top.
          if (i - r >= 0 && j - r >= 0){
            let unit = unitsClone[i-r][j-r];
            if (unit === null) highlightedClone[i-r][j-r] = true;
            else {
              unit = unit.split("_");
              if (unit[0] === "W") {
                highlightedClone[i-r][j-r] = true;
                break;
              } else break;
            }
          }
        }
        
    }
        
    this.setState({ highlighted: highlightedClone });
  }

  king = (i,j,highlightedClone) => {
    const unitsClone = arrayClone(this.state.units);
    const turn = this.state.currTurn;
    if (turn === "W") {
      if (i >= 1) {
        
        let unit = unitsClone[i-1][j];
        console.log(unit)
        if ( unit === null) highlightedClone[i-1][j] = true;
        else {
          unit = unit.split("_")
          if (unit[0] === "B") highlightedClone[i-1][j] = true;
        }
        
        if (j >= 1) {
          let unit = unitsClone[i-1][j-1];
          if ( unit === null) highlightedClone[i-1][j-1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'B') highlightedClone[i-1][j-1] = true;
          }
        }
        if (j <= 6) {
          let unit = unitsClone[i-1][j+1];
          if ( unit === null) highlightedClone[i-1][j+1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'B') highlightedClone[i-1][j+1] = true;
          }
        }
      }
      
      if (i <= 6) {
        
        let unit = unitsClone[i+1][j];
        console.log(unit)
        if ( unit === null) highlightedClone[i+1][j] = true;
        else {
          unit = unit.split("_")
          if (unit[0] === "B") highlightedClone[i+1][j] = true;
        }
        
        if (j >= 1) {
          let unit = unitsClone[i+1][j-1];
          if ( unit === null) highlightedClone[i+1][j-1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'B') highlightedClone[i+1][j-1] = true;
          }
        }
        if (j <= 6) {
          let unit = unitsClone[i+1][j+1];
          if ( unit === null) highlightedClone[i+1][j+1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'B') highlightedClone[i+1][j+1] = true;
          }
        }
      }
      
      if (j >= 1) {
        let unit = unitsClone[i][j-1];
        if (unit === null) highlightedClone[i][j-1] = true;
        else {
          unit = unit.split("_");
          if (unit[0] === "B") highlightedClone[i][j-1] = true;
        }
      }
      
      if (j <= 6) {
        let unit = unitsClone[i][j+1];
        if (unit === null) highlightedClone[i][j+1] = true;
        else {
          unit = unit.split("_");
          if (unit[0] === "B") highlightedClone[i][j+1] = true;
        }
      }
      
    } 
    else {
      if (i >= 1) {
        
        let unit = unitsClone[i-1][j];
        console.log(unit)
        if ( unit === null) highlightedClone[i-1][j] = true;
        else {
          unit = unit.split("_")
          if (unit[0] === "W") highlightedClone[i-1][j] = true;
        }
        
        if (j >= 1) {
          let unit = unitsClone[i-1][j-1];
          if ( unit === null) highlightedClone[i-1][j-1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'W') highlightedClone[i-1][j-1] = true;
          }
        }
        if (j <= 6) {
          let unit = unitsClone[i-1][j+1];
          if ( unit === null) highlightedClone[i-1][j+1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'W') highlightedClone[i-1][j+1] = true;
          }
        }
      }
      
      if (i <= 6) {
        
        let unit = unitsClone[i+1][j];
        console.log(unit)
        if ( unit === null) highlightedClone[i+1][j] = true;
        else {
          unit = unit.split("_")
          if (unit[0] === "W") highlightedClone[i+1][j] = true;
        }
        
        if (j >= 1) {
          let unit = unitsClone[i+1][j-1];
          if ( unit === null) highlightedClone[i+1][j-1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'W') highlightedClone[i+1][j-1] = true;
          }
        }
        if (j <= 6) {
          let unit = unitsClone[i+1][j+1];
          if ( unit === null) highlightedClone[i+1][j+1] = true;
          else {
            unit = unit.split("_");
            if (unit[0] === 'W') highlightedClone[i+1][j+1] = true;
          }
        }
      }
      
      if (j >= 1) {
        let unit = unitsClone[i][j-1];
        if (unit === null) highlightedClone[i][j-1] = true;
        else {
          unit = unit.split("_");
          if (unit[0] === "W") highlightedClone[i][j-1] = true;
        }
      }
      
      if (j <= 6) {
        let unit = unitsClone[i][j+1];
        if (unit === null) highlightedClone[i][j+1] = true;
        else {
          unit = unit.split("_");
          if (unit[0] === "W") highlightedClone[i][j+1] = true;
        }
      }
    }
  }

  queen = (i, j, highlightedClone) => {
      this.rook(i, j, highlightedClone);
      this.bishop(i, j, highlightedClone);
  }
  
  render () {
    return (
      <Grid
        units={this.state.units}
        currTurn={this.state.currTurn}
        key="Grid"
        handleSelect={this.state.isTurn ? this.handleSelect: () => false}
        highlighted={this.state.highlighted}
        moveUnit={this.state.isTurn ? this.moveUnit : () => false}
      />
      //Yeah, "this.state.isTurn ?" checks if it is player's turn. if it is, it handles it normally, otherwise it returns false..which means he can't click the box
      // That's awesome.
      //same with handleSelect.
      // Great.
    );
  }
}

function arrayClone(arr) {
  return JSON.parse(JSON.stringify(arr));
}

export default Main;
