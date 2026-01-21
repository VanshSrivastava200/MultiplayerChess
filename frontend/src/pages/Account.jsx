import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaCrown,
  FaTrophy,
  FaChartLine,
  FaGamepad,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaMinus,
  FaGlobe,
  FaStar,
  FaBullseye,
  FaClock,
  FaUsers,
  FaBolt,
  FaChessKnight,
  FaChessBoard,
  FaChess,
  FaFlag,
  FaUser,
  FaHistory
} from "react-icons/fa";

export const Account = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [games, setGames] = useState([]);
  const [userinfo, setUserinfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          getData(result.data.user);
        }
      } catch (error) {
        console.error("Error", error);
        navigate("/login");
      }
    };

    checkLogin();
  }, [navigate]);

  const getData = async (curus) => {
    try {
      const userData = await axios.post("http://localhost:3000/getdata", {
        uid: curus
      });
      setGames(userData.data.games.reverse());
      setUserinfo(userData.data.accdetails);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from games
  const calculateStats = () => {
    if (!games || !currentUser) return { wins: 0, losses: 0, draws: 0, total: 0, winRate: "0%" };

    let wins = 0, losses = 0, draws = 0;

    games.forEach(game => {
      if ((game.username1 === currentUser && game.status === 1) || 
          (game.username2 === currentUser && game.status === 2)) {
        wins++;
      } else if ((game.username1 === currentUser && game.status === 2) || 
                 (game.username2 === currentUser && game.status === 1)) {
        losses++;
      } else if (game.status === 3) {
        draws++;
      }
    });

    const total = wins + losses + draws;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) + "%" : "0%";

    return { wins, losses, draws, total, winRate };
  };

  const stats = calculateStats();

  // Get result icon
  const getResultIcon = (game) => {
    const isWin = (game.username1 === currentUser && game.status === 1) || 
                  (game.username2 === currentUser && game.status === 2);
    const isDraw = game.status === 3;

    if (isWin) return <FaCheckCircle className="w-4 h-4 text-green-500" />;
    if (isDraw) return <FaMinus className="w-4 h-4 text-yellow-500" />;
    return <FaTimesCircle className="w-4 h-4 text-red-500" />;
  };

  // Get result text and color
  const getResultText = (game) => {
    const isWin = (game.username1 === currentUser && game.status === 1) || 
                  (game.username2 === currentUser && game.status === 2);
    const isDraw = game.status === 3;

    if (isWin) return { text: "Win", color: "text-green-500", bg: "bg-green-100" };
    if (isDraw) return { text: "Draw", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "Loss", color: "text-red-500", bg: "bg-red-100" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  if (!userinfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-xl">No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 text-gray-800 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <FaChessKnight className="text-3xl text-green-600" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">VChess</h1>
              <p className="text-gray-600">Player Profile</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button 
              onClick={() => navigate("/chess")}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
            >
              <FaChessBoard className="text-lg" />
              <span>Start New Game</span>
            </button>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaUsers className="w-4 h-4" />
                <span>10k+ Players</span>
              </div>
              <div className="flex items-center gap-2">
                <FaBolt className="w-4 h-4" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Profile Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Player Avatar */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <FaCrown className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  Online
                </div>
              </div>
              
              {/* Player Info */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {userinfo.username}
                  </h2>
                  {userinfo.country && (
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                      <FaFlag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {userinfo.country}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FaTrophy className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{userinfo.rating}</div>
                      <div className="text-sm text-gray-600">Rating</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FaCalendarAlt className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Joined</div>
                      <div className="text-sm">{userinfo.createdAt.substring(0, 10)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto">
        {/* Stats and Game History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Statistics */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FaChartLine className="w-5 h-5 text-green-600" />
                </div>
                <span>Player Statistics</span>
              </h3>
              
              <div className="space-y-6">
                {/* Win Rate Card */}
                <div className="bg-green-50 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700 font-medium">Win Rate</span>
                    <span className="text-2xl font-bold text-green-600">{stats.winRate}</span>
                  </div>
                  <div className="w-full bg-green-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${parseFloat(stats.winRate) || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Game Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
                    <div className="text-sm text-gray-600 mt-1">Wins</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
                    <div className="text-sm text-gray-600 mt-1">Losses</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.draws}</div>
                    <div className="text-sm text-gray-600 mt-1">Draws</div>
                  </div>
                </div>
                
                {/* Total Games */}
                <div className="bg-white border border-green-100 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <FaGamepad className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-gray-700 font-medium">Total Games</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Game History */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FaHistory className="w-5 h-5 text-green-600" />
                </div>
                <span>Recent Games</span>
              </h3>
              
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <FaGamepad className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No games played yet</p>
                  <p className="text-gray-500 mb-6">Start your first chess match and build your legacy!</p>
                  <button 
                    onClick={() => navigate("/startgame")}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                  >
                    Play Your First Game
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {games.slice(0, 10).map((game) => {
                    const opponent = game.username1 === currentUser ? game.username2 : game.username1;
                    const result = getResultText(game);
                    
                    return (
                      <div 
                        key={game._id} 
                        className="bg-white hover:bg-green-50 rounded-xl p-4 transition-all duration-200 border border-gray-200 hover:border-green-200 hover:shadow-md cursor-pointer"
                        onClick={() => {/* You can add game details view here */}}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {getResultIcon(game)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{opponent}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <FaCalendarAlt className="w-3 h-3" />
                                {game.createdAt.substring(0, 10)}
                                <span className="mx-2">•</span>
                                {game.createdAt.substring(11, 16)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-lg ${result.bg} ${result.color} font-bold text-sm min-w-[80px] text-center`}>
                              {result.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {games.length > 10 && (
                    <div className="text-center pt-6">
                      <button className="text-green-600 hover:text-green-700 font-medium transition-colors flex items-center justify-center gap-2 mx-auto">
                        <span>View All Games ({games.length})</span>
                        <FaChess className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};