import { useState, useCallback, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { connectWS } from "../ws";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChessKnight, FaCrown, FaTrophy, FaHistory, FaComments, FaPaperPlane, FaSyncAlt, FaCircle, FaUser } from "react-icons/fa";

export const ChessGame = () => {
  let navigate = useNavigate();
  const [isPaired, setIsPaired] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [moveLog, setMoveLog] = useState([]);
  const socket = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [opp, setOpp] = useState(null);
  const [messages, setMessages] = useState([]);
  const [color, setColor] = useState(null);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [myrating, setMyrating] = useState(null);
  const [opprating, setOpprating] = useState(null);
  const [activeTab, setActiveTab] = useState("moves");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const result = await axios.post(
          "http://localhost:3000/startgame",
          {},
          { withCredentials: true }
        );
        if (!result.data.check) {
          navigate("/login");
        } else {
          setCurrentUser(result.data.user);
          // Fetch current user rating
          const ratingResult = await getRating(result.data.user);
          setMyrating(ratingResult);
        }
      } catch (error) {
        console.error("Error starting game:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkLogin();

    socket.current = connectWS();
    socket.current.on("connect", () => {
      console.log("user connected");
    });
    
    socket.current.on("paired", async (obj) => {
      setColor(obj.p);
      setOpp(obj.opp);
      setIsPaired(true);
      
      // Fetch opponent rating
      if (obj.opp) {
        const oppRatingValue = await getRating(obj.opp);
        setOpprating(oppRatingValue);
      }
      
      if (obj.p === "W") {
        setIsPlaying(true);
      }
    });

    socket.current.on("getMove", ({ sourceSquare, targetSquare }) => {
      onOppDrop(sourceSquare, targetSquare);
      setIsPlaying(true);
    });

    socket.current.on("getMessage", (message) => {
      setMessages((m) => [...m, { message, user: "opp", timestamp: new Date() }]);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const getRating = async (id) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/getrating",
        { id },
        { withCredentials: true }
      );
      return response.data.rating;
    } catch (err) {
      console.log("Error fetching rating:", err);
      return null;
    }
  };

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
          const moveNotation = `${game.turn() === "w" ? "Black" : "White"}: ${move.san}`;
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
      socket.current.emit('setMessage', message);
      setMessages((prev) => [...prev, { message: message.trim(), user: "me", timestamp: new Date() }]);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const getGameStatus = () => {
    if (game.game_over()) {
      if (game.in_checkmate()) {
        if(game.turn() === 'w' && color === 'W' || game.turn() === 'b' && color === 'B')
          return "Checkmate! You Lost";
        else
          socket.current.emit("over", { gamestatus: currentUser });
          return "Checkmate! You Won!";
      }
      if (game.in_draw()) {
        socket.current.emit("over", { gamestatus: "draw" });
        return "Draw!";
      }
      if (game.in_stalemate()) {
        socket.current.emit("over", { gamestatus: "draw" });
        return "Stalemate!";
      }
      
      socket.current.emit("over", { gamestatus: "draw" });
      return "Game Over!";
    }
    if (game.in_check()) return "Check!";
    return `${game.turn() === "w" ? "White" : "Black"} to move`;
  };

  // Auto-scroll refs
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

  const getStatusColor = () => {
    const status = getGameStatus();
    if (status.includes("Won")) return "text-green-600";
    if (status.includes("Lost")) return "text-red-600";
    if (status.includes("Check")) return "text-amber-600";
    if (status.includes("Draw") || status.includes("Stalemate")) return "text-gray-600";
    return "text-gray-700";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <FaChessKnight className="text-3xl text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VChess</h1>
              <p className="text-gray-600 text-sm">Live Multiplayer</p>
            </div>
          </div>
          
          {/* Game Status - Normal text, not like a button */}
          <div className={`px-6 py-3 rounded-xl font-bold text-lg ${getStatusColor()} transition-all duration-300 bg-white/80 border border-green-200 shadow-sm`}>
            {getGameStatus()}
          </div>
          
          {/* Removed New Game button from here */}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Board */}
          <div className="lg:w-2/3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              
              {/* Opponent Info - ABOVE THE BOARD */}
              <div className="mb-4 p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                        <FaUser className="text-lg text-white" />
                      </div>
                      {color === "B" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                          <FaCrown className="text-xs text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 font-bold">
                          {isPaired ? opp : "Searching for opponent..."}
                        </span>
                        {color === "B" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            White
                          </span>
                        )}
                        {color === "W" && (
                          <span className="px-2 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
                            Black
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <FaTrophy className="text-amber-500 text-xs" />
                        <span className="text-gray-700 text-sm font-medium">{opprating || "..."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Turn Indicator - Simplified */}
              <div className="mb-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-700">
                  <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">
                    {isPlaying ? "Your turn to move" : "Waiting for opponent..."}
                  </span>
                </div>
              </div>

              {/* Chessboard Container */}
              <div className="relative">
                {!isPaired && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-gray-800 text-xl font-bold mb-2">Searching for Opponent</h3>
                    <p className="text-gray-600">Finding the perfect match for you...</p>
                  </div>
                )}
                
                {/* Chessboard - DO NOT TOUCH */}
                <Chessboard
                  position={game.fen()}
                  onPieceDrop={onDrop}
                  customBoardStyle={{
                    borderRadius: "12px",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
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
              </div>

              {/* Current User Info - BELOW THE BOARD */}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                        <FaUser className="text-lg text-white" />
                      </div>
                      {color === "W" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                          <FaCrown className="text-xs text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 font-bold">{currentUser || "Loading..."}</span>
                        {color === "W" && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                            White
                          </span>
                        )}
                        {color === "B" && (
                          <span className="px-2 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
                            Black
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <FaTrophy className="text-amber-500 text-xs" />
                        <span className="text-gray-700 text-sm font-medium">{myrating || "Loading rating..."}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Game Button - BELOW current user info */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => navigate(0)}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <FaSyncAlt />
                  <span>New Game</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Moves & Chat */}
          <div className="lg:w-1/3">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 h-full">
              {/* Tabs */}
              <div className="flex mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-1 border border-green-200">
                <button
                  onClick={() => setActiveTab("moves")}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 ${
                    activeTab === "moves" 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-green-700 hover:bg-white/50'
                  }`}
                >
                  <FaHistory />
                  <span>Move History</span>
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 ${
                    activeTab === "chat" 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-green-700 hover:bg-white/50'
                  }`}
                >
                  <FaComments />
                  <span>Chat</span>
                </button>
              </div>

              {/* Moves Tab */}
              {activeTab === "moves" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-900 font-bold text-lg">Move History</h3>
                    <span className="text-gray-600 text-sm bg-green-100 px-3 py-1 rounded-full">
                      {moveLog.length} moves
                    </span>
                  </div>
                  <div 
                    ref={moveListRef}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100 border border-green-200"
                  >
                    {moveLog.length > 0 ? (
                      <div className="space-y-2">
                        {moveLog.map((move, index) => (
                          <div 
                            key={index}
                            className="p-3 rounded-lg bg-white/80 backdrop-blur-sm border border-green-100 hover:bg-green-100/50 transition-colors duration-150 shadow-sm"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-500 w-6 text-sm">#{Math.floor(index / 2) + 1}</span>
                                <div className={`w-8 h-8 rounded-full ${
                                  index % 4 < 2 ? 'bg-amber-100' : 'bg-blue-100'
                                } flex items-center justify-center`}>
                                  {index % 4 < 2 ? (
                                    <FaChessKnight className="text-amber-600 text-xs" />
                                  ) : (
                                    <FaChessKnight className="text-blue-600 text-xs" />
                                  )}
                                </div>
                                <span className="text-gray-800 font-semibold font-mono">{move}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <FaHistory className="text-4xl text-green-400 mb-4" />
                        <h4 className="text-gray-600 font-bold mb-2">No moves yet</h4>
                        <p className="text-gray-500 text-sm">Make the first move to start the game!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === "chat" && (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex justify-between items-center">
                    <h3 className="text-gray-900 font-bold text-lg">Game Chat</h3>
                    <span className="text-gray-600 text-sm bg-green-100 px-3 py-1 rounded-full">
                      {messages.length} messages
                    </span>
                  </div>
                  <div 
                    ref={messageListRef}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-green-100 border border-green-200"
                  >
                    {messages.length > 0 ? (
                      <div className="space-y-3">
                        {messages.map((msg, index) => (
                          <div 
                            key={index}
                            className={`flex ${msg.user === "me" ? "justify-end" : "justify-start"}`}
                          >
                            <div 
                              className={`max-w-[80%] p-3 rounded-2xl ${
                                msg.user === "me" 
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-none shadow-md" 
                                : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-green-100"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs opacity-75 font-medium">
                                  {msg.user === "me" ? "You" : "Opponent"}
                                </span>
                                <span className="text-xs opacity-75">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <FaComments className="text-4xl text-green-400 mb-4" />
                        <h4 className="text-gray-600 font-bold mb-2">No messages yet</h4>
                        <p className="text-gray-500 text-sm">Send a greeting to your opponent!</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 bg-white/80 border border-green-200 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent placeholder-gray-500 shadow-sm"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        className="px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md"
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};