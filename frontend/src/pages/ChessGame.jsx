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
  const [message, setMessage] = useState("");
  const [openmsg, setOpenmsg] = useState(false);

  useEffect(() => {
    console.log(isPlaying);
  }, [isPlaying]);

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
      onOppDrop(sourceSquare, targetSquare);
      setIsPlaying(true);
    });

    socket.current.on("getMessage", (message) => {
      setMessages((m) => [...m, { message, user: "opp" }]);
    });
  }, []);

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {
      if (!isPlaying) return false;

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
          setIsPlaying(false);
          return true;
        }
      } catch (error) {
        return false;
      }
      return false;
    },
    [game, isPlaying]
  );

  const onOppDrop = useCallback((sourceSquare, targetSquare) => {
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
  }, []);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      // For now, just save the message locally
      // In a real implementation, you would emit this via socket
      socket.current.emit('setMessage',message)
      setMessages((prev) => [...prev, { message: message.trim(), user: "me" }]);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

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
    display: "flex",
    flexDirection: "column",
  };

  const parentStyle = {
    position: "relative",
    overflow: "hidden",
  };

  const moveListStyle = {
    height: "150px",
    overflowX: "auto",
    overflowY: "hidden",
    border: "1px solid #eee",
    padding: "10px",
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: "10px",
    alignItems: "flex-start",
  };

  const moveItemStyle = {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#fff",
    minWidth: "80px",
    textAlign: "center",
    flexShrink: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  // Message section styles
  const messageSectionStyle = {
    marginTop: "20px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    height: "200px",
  };

  const messageListStyle = {
    flex: 1,
    overflowY: "auto",
    border: "1px solid #eee",
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
  };

  const messageItemStyle = {
    padding: "8px 12px",
    marginBottom: "8px",
    borderRadius: "4px",
    wordWrap: "break-word",
  };

  const myMessageStyle = {
    ...messageItemStyle,
    backgroundColor: "#2196f3",
    color: "white",
    marginLeft: "20px",
    textAlign: "right",
  };

  const oppMessageStyle = {
    ...messageItemStyle,
    backgroundColor: "#e0e0e0",
    color: "#333",
    marginRight: "20px",
    textAlign: "left",
  };

  const messageInputContainerStyle = {
    display: "flex",
    gap: "10px",
  };

  const messageInputStyle = {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  };

  const sendButtonStyle = {
    padding: "8px 16px",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
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

  // Auto-scroll to the end when new moves are added
  const moveListRef = useRef(null);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollLeft = moveListRef.current.scrollWidth;
    }
  }, [moveLog]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={containerStyle}>
      <div style={boardContainerStyle}>
        <div style={statusStyle}>{getGameStatus()}</div>
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
        <div style={moveListStyle} ref={moveListRef}>
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
                width: "100%",
              }}
            >
              No moves yet
            </div>
          )}
        </div>

        {/* Message Section */}
        <div style={messageSectionStyle}>
          <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>Chat</h3>
          <div style={messageListStyle} ref={messageListRef}>
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={msg.user === "me" ? myMessageStyle : oppMessageStyle}
                >
                  {msg.message}
                </div>
              ))
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  fontStyle: "italic",
                  padding: "20px",
                }}
              >
                No messages yet. Start a conversation!
              </div>
            )}
          </div>
          <div style={messageInputContainerStyle}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={messageInputStyle}
            />
            <button
              onClick={handleSendMessage}
              style={sendButtonStyle}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#1976d2")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#2196f3")}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};