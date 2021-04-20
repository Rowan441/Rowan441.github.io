// Global vars.
let canvas, ctx, pieces, sounds;

// Loads sounds then adds them to 'sounds' object
function getSFXs() {

	sounds = {}

	let audioElement = new Audio('./assets/audio/chess-move.mp3');
	audioElement.addEventListener("canplaythrough", function() { 
		sounds["chess-move"] = audioElement;
	}, true);

	audioElement2 = new Audio('./assets/audio/chess-capture.mp3');
	audioElement2.addEventListener("canplaythrough", function() { 
		sounds["chess-capture"] = audioElement2;
	}, true);

}

function getImagesfromDom() {

	let pieces = {
		"white-king" : $("#white-king").get(0),
		"white-knight" : $("#white-knight").get(0),
		"white-rook" : $("#white-rook").get(0),
		"black-king" : $("#black-king").get(0),
		"black-knight" : $("#black-knight").get(0),
		"black-rook" : $("#black-rook").get(0),
	}
	
	return pieces

}

function drawBoard(ctx, pieceList, tileSelected, legalMoves) {
	const darkTileColor = "#b58863";
	const lightTileColor = "#f0d9b5 ";
	const highlightColor = "rgba(10, 255, 10, 0.15)";
	const checkColor = "rgba(255, 0, 0, 0.4)";
	const indicatorColor = "rgba(0, 0, 0, 0.25)";
	const pieceScale = 100;
	
	// draw: board
	ctx.fillStyle = darkTileColor;
	ctx.fillRect(0, 0, 100, 100);
	ctx.fillRect(200, 0, 100, 100);
	ctx.fillRect(400, 0, 100, 100);
	ctx.fillRect(600, 0, 100, 100);
	
	ctx.fillStyle = lightTileColor;
	ctx.fillRect(100, 0, 100, 100);
	ctx.fillRect(300, 0, 100, 100);
	ctx.fillRect(500, 0, 100, 100);
	ctx.fillRect(700, 0, 100, 100);
	
	// draw: highlighted tile
	if (tileSelected != -1) {
		ctx.fillStyle = highlightColor;
		ctx.fillRect(tileSelected*100, 0, 100, 100);
	}

	// draw: king in check tiles
	let kingPos = checkedKing(pieceList, "white");
	if (kingPos != "none") {
		ctx.fillStyle = checkColor;
		ctx.fillRect(kingPos*100, 0, 100, 100);
	}
	kingPos = checkedKing(pieceList, "black");
	if (kingPos != "none") {
		ctx.fillStyle = checkColor;
		ctx.fillRect(kingPos*100, 0, 100, 100);
	}

	console.log(pieces); 
	
	// draw: pieces
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i] != "Empty") {			
			ctx.drawImage(pieces[pieceList[i]], i*100, 0, pieceScale, pieceScale);
		}
	}
	
	// draw: legal move indicators
	if (legalMoves) {
		for (let i = 0; i < legalMoves.length; i++) {
			ctx.strokeStyle = indicatorColor;
			ctx.fillStyle = indicatorColor;
			ctx.beginPath();
			if (pieceList[legalMoves[i]] == "Empty") {
				// draw circle
				ctx.arc(legalMoves[i]*100+50, 50, 15, 0, 2*Math.PI);	
			} else {
				// draw ring
				ctx.arc(legalMoves[i]*100+50, 50, 45, 0, 2*Math.PI);
				ctx.arc(legalMoves[i]*100+50, 50, 40, 0, 2*Math.PI);
			}
			ctx.fill("evenodd");
		}
	}
}

//from: https://stackoverflow.com/a/5417934
function getCursorPosition(e) {
	let x, y;

	canoffset = canvas.offset();
	x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - Math.floor(canoffset.left);
	y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - Math.floor(canoffset.top) + 1;

	return [x,y];
}

// Returns the index of the chess tile that was clicked on thefrom click event 'e'
function getTileFromClick(e) {
	return Math.floor(getCursorPosition(e)[0]/100);
}

// Returns all the possible moves for the piece at 'startPos' 
// (assumes piece at 'startPos' has color: 'turn')
// DOESNT check if king is in check
function getPossbleMoves(startPos, pieceList, turn) {
	
	function potentialMove(x) {
		return 0 <= x && x <= 7 && !pieceList[x].includes(turn);
	}
	
	let possibleMoves = []; // moves allow by rules of piece
	
	let pieceType = pieceList[startPos].split("-")[1];
	switch(pieceType) {
		case "king":
			if (potentialMove(startPos+1)) {
				possibleMoves.push(startPos+1);
			}
			if (potentialMove(startPos-1)) {
				possibleMoves.push(startPos-1);
			}
			break;
		case "knight":
			if (potentialMove(startPos+2)) {
				possibleMoves.push(startPos+2);
			}
			if (potentialMove(startPos-2)) {
				possibleMoves.push(startPos-2);
			}
			break;
		case "rook":
			//TODO: clean this up
			// leftwards moves:
			if (startPos !== 0){ // Check if rook is on left edge of board
			  for (let i = startPos-1; i >= 0; i--){
				if (pieceList[i] != "Empty") {
				  // There is a piece in the way so rook cannot move past here
				  // But, check if we can take the piece in the way
				  if ( !pieceList[i].includes(turn) ) {
					  possibleMoves.push(i);
				  }
				  break;
				} else {
				  possibleMoves.push(i);
				}
			  }
			}
			// Rightward moves:
			// Check if rook is on right edge of board
			if (startPos !== 7){
			  for (let i = startPos+1; i <= 7; i++){
				if (pieceList[i] != "Empty"){
				  // There is a piece in the way so rook cannot move past here
				  // But, check if we can take the piece in the way
				  if ( !pieceList[i].includes(turn) ) {
					  possibleMoves.push(i);
				  }
				  break;
				} else {
				  possibleMoves.push(i);
				}
			  }
			}
			break;
	}
	
	return possibleMoves;
}

// Returns all the legal moves for the piece at 'startPos' 
// (assumes piece at 'startPos' has color: 'turn')
// Checks if king is in check
function getLegalMoves(startPos, pieceList, turn) {
	
	let possibleMoves = getPossbleMoves(startPos, pieceList, turn);
	let legalMoves = []; //moves allowed by rules of piece AND doesn't put king in check
	
	// check if king now in check
	possibleMoves.forEach(function(endPos) {	
		// make the potential move in 'newPieceList'
		newPieceList = [...pieceList]; //clone array
		makeMove(startPos, endPos, newPieceList);
		// Check if king would be in check
		if (!inCheck(newPieceList, turn)) {
			legalMoves.push(endPos)
		}	
	});
			
	return legalMoves;
}

// moves piece at 'from' to 'to' in pieceList
function makeMove(from, to, pieceList) {
	pieceList[to] = pieceList[from];
	pieceList[from] = "Empty";
	
	return pieceList;
}

function otherColor(color) {
	if (color == "white") {
		return "black";
	} else {
		return "white";
	}
}

// Returns the position of a king in check, fales if king is not in check
function checkedKing(pieceList, turn) {

	// find king
	let kingPos;
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i] == (turn + "-king") ) {
			kingPos = i;
			break;
		}
	}
	
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i].includes(otherColor(turn))) {
			let possibleMoves = getPossbleMoves(i, pieceList, otherColor(turn));
			if (possibleMoves.includes(kingPos)) {
				return kingPos;
			}
		}
	}
	
	
	return "none";

}

// returns true is 'turn's king is in immediate danger
function inCheck(pieceList, turn) {
	
	// find king
	let kingPos;
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i] == (turn + "-king") ) {
			kingPos = i;
			break;
		}
	}
	
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i].includes(otherColor(turn))) {
			let possibleMoves = getPossbleMoves(i, pieceList, otherColor(turn));
			if (possibleMoves.includes(kingPos)) {
				return true;
			}
		}
	}
	
	
	return false;
	
}

// Checks for win conditions (i.e win, loss, draw)
function isEndOfGame(pieceList, turn, threefoldRep) {
	let kingInCheck = inCheck(pieceList, turn);
	
	let anyLegalMoves = false;
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i].includes(turn)) {
			if (getLegalMoves(i, pieceList, turn).length != 0) {
				anyLegalMoves = true;
				break;
			}
		}
	}
	
	let onlyKingsLeft = true;
	for (let i = 0; i < pieceList.length; i++) {
		if (pieceList[i].includes("knight") || pieceList[i].includes("rook")) {
			onlyKingsLeft = false;
			break;
		}
	}
	
	if (onlyKingsLeft) {
		return {
			"winner" : "draw", 
			"reason" : "insufficient material"
		};
	}
	
	if (threefoldRep){
		return {
			"winner" : "draw", 
			"reason" : "3-fold repetition"
		};
	}
	
	if (anyLegalMoves) {
		return {
			"winner" : "none"
		};
	}
	
	if (kingInCheck && !anyLegalMoves) {
		return {
			"winner" : otherColor(turn), 
			"reason" : "checkmate"
		};
	}
	
	if (!kingInCheck && !anyLegalMoves) {
		return {
			"winner" : "draw", 
			"reason" : "stalemate"
		};
	}
	
	
	
}

function drawEndScreen(gameResult) {
	const backgroundColour = "rgba(0, 0, 0, 0.5)";
	const textColor = "rgb(255, 255, 255)";
	
	// draw: background
	ctx.fillStyle = backgroundColour;
	ctx.fillRect(0, 0, 800, 100);
	
	// draw: win text
	ctx.fillStyle = textColor;
	ctx.textAlign = "center";
	ctx.font = "40px Arial";
	ctx.textBaseline = "middle";
	let message;
	switch (gameResult["winner"]){
		case "white":
			message = "White wins";
			break;
		case "black":
			message = "Black wins";
			break;
		case "draw":
			message = "Draw";
			break;
	}
	message += " by " + gameResult["reason"] + "!";
	ctx.fillText(message, 400, 50);
	
}

// Keeps track of number of times every position has been seen
function recordPosition(pieceList, positionsSeen, threefoldRep) {
	//Hash the game state
	let hash = '';
	pieceList.forEach( function(piece) {
		switch (piece) {
			case "white-king":
				hash += "K";
				break;
			case "white-knight":
				hash += "N";
				break;
			case "white-rook":
				hash += "R";
				break;
			case "Empty":
				hash += " ";
				break;
			case "black-rook":
				hash += "o";
				break;
			case "black-knight":
				hash += "t";
				break;
			case "black-king":
				hash += "g";
				break;
		}
	});
	if (Object.keys(positionsSeen).includes(hash)) {
		positionsSeen[hash] += 1
		if (positionsSeen[hash] == 3) {
			threefoldRep = true;
		}
	} else {
		positionsSeen[hash] = 1;
	}
	return threefoldRep;
}
	
function canClaimDraw(pieceList) {
	let numPieces = 0;
	for (let i = 0; i < pieceList.length; i++) {
		if (!pieceList[i].includes("Empty")) {
			numPieces++;
		}
	}
	if (numPieces == 3){
		return true;
	}
	return false;
}

function makeAIMove(gameState) {



	let bestMove = getBestMove(gameState);
	let startPos = bestMove[0];
	let endPos = bestMove[1];

	let capturingMove = false;
	if (gameState["pieceList"][endPos] != "Empty"){
		capturingMove = true;
	}
	makeMove(startPos, endPos, gameState["pieceList"]);
	gameState["threefoldRep"] = recordPosition(gameState["pieceList"], gameState["positionsSeen"], gameState["threefoldRep"]);
	drawBoard(ctx, gameState["pieceList"], startPos);	
	if (capturingMove) {
		if (sounds["chess-capture"]){ //Play sound
			sounds["chess-capture"].play();
		}
	} else {
		if (sounds["chess-move"]){ //Play sound
			sounds["chess-move"].play();
		}
	}

	// END OF TURN
	gameState["turn"] = otherColor(gameState["turn"])
				
	// Check for winner/loser/draw
	gameState["gameResult"] = isEndOfGame(gameState["pieceList"], gameState["turn"], gameState["threefoldRep"]);
	if (gameState["gameResult"]["winner"] != "none"){
		// Game is over
		drawEndScreen(gameState["gameResult"]);	
		return true;					
	}
	//If the game is not over, check for claim draw-able position
	if (canClaimDraw(gameState["pieceList"])) {
		claimDrawButton.removeClass("invisible");
	}

	return false;

}

window.addEventListener('load', function(){

	// set global vars.
	canvas = $("#chess-canvas");
	ctx = canvas.get(0).getContext("2d");
	pieces = getImagesfromDom();
	getSFXs();

	playAgainButton = $("#chess-replay");
	claimDrawButton = $("#chess-draw");
	
	let selectedTile, legalMoves, gameState;
	let gameEnded = false;

	initGame = function() {
		//init gameState
		gameState = {
			"turn" : "white",
			"gameResult" : {"winner" : "none"},
			"positionsSeen" : {"knr otg" : 1},
			"pieceList" : 
			["white-king", "white-knight", "white-rook", "Empty", "Empty", "black-rook", "black-knight", "black-king"],
			"threefoldRep" : false
		}
		
		// init vars
		selectedTile = -1;
		legalMoves = [];
		
		// draw starting board
		drawBoard(ctx, gameState["pieceList"], selectedTile);

		gameEnded = false;
		
		claimDrawButton.addClass("invisible");
	};
	
	initGame();

	// 'mouesdown on board' event handler
	$("#chess-canvas").mousedown(function(e) {
		
		if (gameState["gameResult"]["winner"] != "none"){
			//Don't allow any input if the game is over
			return;
		}

		if (gameState["turn"] == "black"){
			//Don't allow any input if it's not the player's turn
			return;
		}
		
		let tileClicked = getTileFromClick(e);
		
		if (selectedTile == -1) { // No Selection:
			if (gameState["pieceList"][tileClicked].includes(gameState["turn"])) {
				selectedTile = tileClicked;
				legalMoves = getLegalMoves(selectedTile, gameState["pieceList"], gameState["turn"]);
				drawBoard(ctx, gameState["pieceList"], selectedTile, legalMoves);
			}
		} else { // Piece Selected:
			if (legalMoves.includes(tileClicked)) {
				// Make move
				let capturingMove = false;
				if (gameState["pieceList"][tileClicked] != "Empty"){
					capturingMove = true;
				}
				makeMove(selectedTile, tileClicked, gameState["pieceList"]);
				gameState["threefoldRep"] = recordPosition(gameState["pieceList"], gameState["positionsSeen"], gameState["threefoldRep"]);
				selectedTile = -1;
				drawBoard(ctx, gameState["pieceList"], selectedTile);	
				if (capturingMove) {
					if (sounds["chess-capture"]){ //Play sound
						sounds["chess-capture"].play();
					}
				} else {
					if (sounds["chess-move"]){ //Play sound
						sounds["chess-move"].play();
					}
				}
				
				
				// END OF TURN
				gameState["turn"] = otherColor(gameState["turn"])
				
				// Check for winner/loser/draw
				gameState["gameResult"] = isEndOfGame(gameState["pieceList"], gameState["turn"], gameState["threefoldRep"]);
				if (gameState["gameResult"]["winner"] != "none"){
					// Game is over
					drawEndScreen(gameState["gameResult"]);	
					gameEnded = true;
					return;					
				}

				setTimeout(function(){
					gameEnded = makeAIMove(gameState);
				}, 1000);

				//If the game is not over, check for claim draw-able position
				if (canClaimDraw(gameState["pieceList"])) {
					claimDrawButton.removeClass("invisible");
				}

			} 
			// unselect the piece
			legalMoves = [];
			selectedTile = -1;
			drawBoard(ctx, gameState["pieceList"], selectedTile, legalMoves);	
		}
	});	
	
	playAgainButton.click( function() {
		//reset game
		initGame();
	});
	
	claimDrawButton.click( function() {
		if (! gameEnded) {
			gameState["gameResult"] = {
				"winner" : "draw", 
				"reason" : "agreement"
			};
			drawEndScreen(gameState["gameResult"]);	
			gameEnded = true;
		}
	});
	
	
});