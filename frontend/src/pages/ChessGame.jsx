import { useState, useCallback, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { connectWS } from "../ws";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ChessGame = () => {
  let navigate = useNavigate();
  const [game, setGame] = useState(new Chess());
  const [moveLog, setMoveLog] = useState([]);
  const socket = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [color, setColor] = useState(null);
  // const [message,setMessage]=useState("");
  // const [openmsg,setOpenmsg]=useState(false);

  useEffect(()=>{
    console.log(isPlaying)
  },[isPlaying])

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const result = await axios.post(
          "http://localhost:3000/startgame",
          {},
          {
            withCredentials: true,
          }
        );
        if (!result.data.check) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error starting game:", error);
      }
    };

    checkLogin();

    socket.current = connectWS();
    socket.current.on("connect", () => {
      console.log("user connected");
    });
    socket.current.on("paired", (obj) => {
      setColor(obj.p);
      console.log(obj.p);
      if (obj.p === "W") {
        setIsPlaying(true);
      }
    });

    socket.current.on("getMove", ({ sourceSquare, targetSquare }) => {
        onOppDrop(sourceSquare,targetSquare)
        setIsPlaying(true)
    });

    socket.current.on("getMessage", (message) => {
      setMessages((m) => [...m, { message, user: "opp" }]);
    });
  }, []);

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {

      if(!isPlaying) return false

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (move) {
          socket.current.emit("setMove", { sourceSquare, targetSquare });
          setGame(new Chess(game.fen()));
          const moveNotation = `${game.turn() === "w" ? "Black" : "White"}: ${
            move.san
          }`;
          setMoveLog((prev) => [...prev, moveNotation]);
          setIsPlaying(false)
          return true;
        }
      } catch (error) {
        return false;
      }
      return false;
    },
    [game,isPlaying]
  );
  
  const onOppDrop = useCallback(
  (sourceSquare, targetSquare) => {
    try {
      setGame((prevGame) => {
        const updated = new Chess(prevGame.fen());
        const move = updated.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });

        if (!move) return prevGame;

        const moveNotation = `${updated.turn() === "w" ? "Black" : "White"}: ${move.san}`;
        setMoveLog((prev) => [...prev, moveNotation]);
        setIsPlaying(true);

        return updated;
      });

      return true;
    } catch (error) {
      return false;
    }
  },
  []
);


  const resetGame = () => {
    setGame(new Chess());
    setMoveLog([]);
  };

  const getGameStatus = () => {
    if (game.game_over()) {
      if (game.in_checkmate()) {
        return "Checkmate!";
      }
      if (game.isDraw()) {
        return "Draw!";
      }
      if (game.in_stalemate()) {
        return "Stalemate!";
      }

      return "Game Over!";
    }
    if (game.in_check()) return "Check!";
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  };

  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    display: "flex",
    gap: "20px",
    flexDirection: window.innerWidth < 768 ? "column" : "row",
  };

  const boardContainerStyle = {
    flex: 2,
    maxWidth: "600px",
  };

  const moveLogStyle = {
    flex: 1,
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "15px",
  };

  const parentStyle = {
    position: "relative",
    overflow: "hidden",
  };

  const moveListStyle = {
    height: "400px",
    overflowY: "auto",
    border: "1px solid #eee",
    padding: "10px",
  };

  const moveItemStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee",
    backgroundColor: "#fff",
  };

  const buttonStyle = {
    padding: "8px 16px",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "15px",
  };

  const statusStyle = {
    fontSize: "20px",
    marginBottom: "15px",
    textAlign: "center",
    color: game.in_check() ? "#d32f2f" : "#333",
  };

  //   const maskStyle = {
  //   position: "absolute",
  //   inset: 0,
  //   backgroundColor: "green",  // fully transparent but still blocks clicks
  //   zIndex: 10,
  //   opacity:"80%",
  //   pointerEvents: "auto",             // BLOCKS clicks
  // };

  return (
    <div style={containerStyle}>
      <div style={boardContainerStyle}>
        <div style={statusStyle}>{getGameStatus()}</div>
        {/* <div style={parentStyle}  */}
        {/* > */}
        {/* {!isPlaying&&<div style={maskStyle}>
          </div>} */}
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          customBoardStyle={{
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
            transform: color == "B" ? "rotate(180deg)" : "",
          }}
          customDarkSquareStyle={{
            backgroundColor: "#779952",
            transform: color == "B" ? "rotate(180deg)" : "",
          }}
          customLightSquareStyle={{
            backgroundColor: "#edeed1",
            transform: color == "B" ? "rotate(180deg)" : "",
          }}
        />
        {/* </div> */}
        <button
          onClick={() => {
            navigate(0);
          }}
          style={buttonStyle}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#1976d2")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#2196f3")}
        >
          New Game
        </button>
      </div>

      <div style={moveLogStyle}>
        <h2 style={{ marginBottom: "15px", fontSize: "18px" }}>Move History</h2>
        <div style={moveListStyle}>
          {moveLog.length > 0 ? (
            moveLog.map((move, index) => (
              <div key={index} style={moveItemStyle}>
                {`${Math.floor(index / 2) + 1}. ${move}`}
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#666",
                fontStyle: "italic",
              }}
            >
              No moves yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
