import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { FaChessBoard, FaChessKnight, FaUser } from "react-icons/fa";

export const Home = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const StartGame = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await axios.post(
        "https://multiplayerchess-cl7y.onrender.com/startgame",
        {},
        {
          withCredentials: true,
        }
      );
      if (result.data.check) {
        navigate("/chess");
      } else {
        alert("Please Login first");
        navigate("/login");
      }
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToProfile = () => {
    navigate("/account");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <FaChessKnight className="text-3xl text-white" />
            <h1 className="text-3xl font-bold text-white">VChess</h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Play?</h2>
          <p className="text-green-100">Start a new chess game and challenge yourself</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-200 to-amber-400 rounded-full flex items-center justify-center shadow-lg">
              <FaChessBoard className="text-3xl text-green-900" />
            </div>
            <p className="text-gray-600 mb-6">
              Begin your chess journey with a single click. Test your skills and improve your game.
            </p>
          </div>

          {/* Start Game Button */}
          <button
            onClick={StartGame}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mb-4"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Starting Game...</span>
              </>
            ) : (
              <>
                <FaChessKnight className="text-lg" />
                <span>Start New Game</span>
              </>
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={goToProfile}
            className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 flex items-center justify-center gap-3 border border-gray-300/50"
          >
            <FaUser className="text-gray-600" />
            <span>View Profile</span>
          </button>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">10k+</div>
              <div className="text-xs text-gray-600">Players</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">99.9%</div>
              <div className="text-xs text-gray-600">Uptime</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">50+</div>
              <div className="text-xs text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};