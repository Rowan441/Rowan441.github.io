function tostr(sdf) {
	hash = "[";
	sdf.forEach( function(piece) {
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
				hash += "_";
				break;
			case "black-rook":
				hash += "r";
				break;
			case "black-knight":
				hash += "n";
				break;
			case "black-king":
				hash += "k";
				break;
		}
	});
	hash += "]"
	return hash;
}

function anyRooks(pieceList){
	let numPieces = 0;
	for (let i = 0; i < pieceList.length; i++) {
		if (!pieceList[i].includes("Rook")) {
			return true;
		}
	}
	return false;
}

// Gets the best move for the given board position, given it's 'turn's turn
function getBestMove(gameState) {
	
	//TODO: hardcode in some of the first moves
	
	gameState["noRooks"] = 0;
	gameState["bestMove"] = "None";

	minimax(gameState)

	return gameState.bestMove
}

function minimax(gameState, a=-1, b=1, depth=0) {
	if (depth == 15) {
		//console.log("reached max depth");
		return 0;
	}
	gameState["gameResult"] = isEndOfGame(gameState["pieceList"], gameState["turn"], gameState["threefoldRep"])
	if (gameState["gameResult"]["winner"] != "none") {
		switch (gameState["gameResult"]["winner"]){
			case "white":
				//console.log("white win");
				return 1;
			case "black":
				//console.log("black win");
				return -1 
			case "draw":
				return 0;
		}
	}
	if (canClaimDraw(gameState["pieceList"]) && gameState["bestMove"] != "None") {
		// console.log("1 knight draw");
		return 0;
	}
	if (! anyRooks(gameState["pieceList"])) {
		gameState["noRooks"] += 1;
		if (gameState["noRooks"] == 3) {
			//console.log("2 knights draw");
			return 0;
		}
	}
	let value;
	if (gameState["turn"] == "white") { // Maximizing player
		value = -Infinity;
		// Find all legal moves
		let checkingMoves = [];
		let kingMoves = [];
		let captureMoves = [];
		let otherLegalMoves = [];
		for (let i = 0; i < gameState["pieceList"].length; i++) {
			if (gameState["pieceList"][i].includes(gameState["turn"])) {
				
				getLegalMoves(i, gameState["pieceList"], gameState["turn"]).forEach(function(endPos) {
					// Make move in pieceListAfterMove
					let pieceListAfterMove = [...gameState["pieceList"]]
					makeMove(i, endPos, pieceListAfterMove);
					if (inCheck(pieceListAfterMove, otherColor(gameState["turn"]))){ // Check if this move puts the enemy king in check
						checkingMoves.push([i, endPos])
					}else if (gameState["pieceList"][endPos] != "Empty") {
						captureMoves.push([i, endPos]);
					} else if (gameState["pieceList"][i] == "white-king") {
						kingMoves.push([i, endPos]);
					} else {
						otherLegalMoves.push([i, endPos]);
					}
				});
			}
		}
		let allLegalMoves = checkingMoves.concat(captureMoves.concat(otherLegalMoves.concat(kingMoves)));

		
		for (let i = 0; i < allLegalMoves.length; i++) {
			let movePair = allLegalMoves[i];
			//create gameState for child position
			let childGameState = $.extend(true, {}, gameState) //clone gameState into childGameState
			makeMove(movePair[0], movePair[1], childGameState["pieceList"]);
			childGameState["threefoldRep"] = recordPosition(childGameState["pieceList"], childGameState["positionsSeen"], childGameState["threefoldRep"]);
			childGameState["turn"] = otherColor(childGameState["turn"]);
			childGameState["depth"] = gameState["depth"] + 1;
			
			let childValue = minimax(childGameState, a, b, depth+1);
			if(childValue == 1) {
				gameState["bestMove"] = movePair;
				return childValue
			}
			value = Math.max(value, childValue);
			if (value == childValue) {
				gameState["bestMove"] = movePair;
			}
			a = Math.max(a, value);
			if (a >= b) {
				break;
			}
			
		}
		return value;
	} else { // Minimizing player
		value = Infinity;
		// Find all legal moves
		let checkingMoves = [];
		let kingMoves = [];
		let captureMoves = [];
		let otherLegalMoves = [];
		for (let i = 0; i < gameState["pieceList"].length; i++) {
			if (gameState["pieceList"][i].includes(gameState["turn"])) {
				
				getLegalMoves(i, gameState["pieceList"], gameState["turn"]).forEach(function(endPos) {
					// Make move in pieceListAfterMove
					let pieceListAfterMove = [...gameState["pieceList"]]
					makeMove(i, endPos, pieceListAfterMove);
					if (inCheck(pieceListAfterMove, otherColor(gameState["turn"]))){ // Check if this move puts the enemy king in check
						checkingMoves.push([i, endPos])
					} else if (gameState["pieceList"][endPos] != "Empty") {
						captureMoves.push([i, endPos]);
					} else if (gameState["pieceList"][i] == "white-king") {
						kingMoves.push([i, endPos]);
					} else {
						otherLegalMoves.push([i, endPos]);
					}
				});
			}
		}
		let allLegalMoves = checkingMoves.concat(captureMoves.concat(otherLegalMoves.concat(kingMoves)));
		
		for (let i = 0; i < allLegalMoves.length; i++) {
			let movePair = allLegalMoves[i];
			//create gameState for child position
			let childGameState = $.extend(true, {}, gameState) //clone gameState into childGameState
			makeMove(movePair[0], movePair[1], childGameState["pieceList"]);
			childGameState["threefoldRep"] = recordPosition(childGameState["pieceList"], childGameState["positionsSeen"], childGameState["threefoldRep"]);
			childGameState["turn"] = otherColor(childGameState["turn"]);
		
			let childValue = minimax(childGameState, a, b, depth+1);
			if(childValue == -1) {
				gameState["bestMove"] = movePair;
				return childValue
			}
			value = Math.min(value, childValue);
			if (value == childValue) {
				gameState["bestMove"] = movePair;
			}
			b = Math.max(b, value);
			if (b <= a){
				break;
			}
		}
		return value;
	}
}

