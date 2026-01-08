import React, { useEffect, useRef, useState } from "react";
import MuteButton from "./MuteButton";
import { Link, useNavigate } from "react-router-dom";

const Menu = () => {
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const [showDifficulty, setShowDifficulty] = useState(false);

  useEffect(() => {
    // Auto play background music
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set volume to 50%
      audioRef.current.play().catch((err) => {
        console.log("Auto-play prevented by browser:", err);
      });
    }
  }, []);

  // Play audio on user interaction
  const handleUserInteraction = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch((err) => {
        console.log("Play failed:", err);
      });
    }
  };

  // Fungsi navigasi ke AI mode dengan difficulty
  const startAiGame = (difficulty) => {
    navigate("/arenavsai", { state: { difficulty } });
  };

  return (
    <div
      className="relative flex flex-col justify-center space-y-3 items-center w-screen h-screen overflow-hidden"
      onClick={handleUserInteraction}
    >
      {/* Background Music */}
      <audio ref={audioRef} loop>
        <source src="/medieval-kingdom-loop-366815.mp3" type="audio/mpeg" />
      </audio>

      {/* Background Image */}
      <img
        src="/sfk.avif"
        alt="Leaders Background"
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* Overlay gelap agar text lebih terbaca */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10"></div>

      {/* Content */}
      <div className="relative z-20 text-white flex flex-col space-y-6 items-center">
        <div className="royal-title">
          <img
            src="/Leaders_logo.png"
            alt="Leaders"
            style={{ width: "400px" }}
          />
        </div>
        <div className="royal-subtitle">
          By : 223117102 - Rafael Jove, 223117103 - Raoul Stanley Kho, 223117104
          - Richard Gunawan
        </div>
        <Link to="/arena" className="w-80 kingdom-btn text-center">
          Play 2 Player (Multiplayer)
        </Link>
        
        {/* Play vs AI dengan Difficulty Selection */}
        {!showDifficulty ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDifficulty(true);
            }}
            className="w-80 kingdom-btn text-center"
          >
            Play vs AI
          </button>
        ) : (
          <div className="flex flex-col space-y-2 w-80">
            <p className="text-center text-yellow-400 font-bold mb-1">Select Difficulty:</p>
            <button
              onClick={() => startAiGame("Easy")}
              className="kingdom-btn text-center bg-green-800 hover:bg-green-700 text-sm py-2"
            >
              Easy (Apprentice)
            </button>
            <button
              onClick={() => startAiGame("Medium")}
              className="kingdom-btn text-center bg-blue-800 hover:bg-blue-700 text-sm py-2"
            >
              Medium (Knight)
            </button>
            <button
              onClick={() => startAiGame("Hard")}
              className="kingdom-btn text-center bg-red-800 hover:bg-red-700 text-sm py-2"
            >
              Hard (King)
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDifficulty(false);
              }}
              className="text-gray-400 text-xs hover:text-white mt-2 underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Mute Button */}
      <MuteButton audioRef={audioRef} />
    </div>
  );
};

export default Menu;
