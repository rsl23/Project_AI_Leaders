import React, { useEffect, useRef } from "react";
import MuteButton from "./MuteButton";
import { Link } from "react-router-dom";

const Menu = () => {
  const audioRef = useRef(null);

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
        <Link to="/arena" className="w-80 kingdom-btn text-center">
          Play vs AI
        </Link>
      </div>

      {/* Mute Button */}
      <MuteButton audioRef={audioRef} />
    </div>
  );
};

export default Menu;
