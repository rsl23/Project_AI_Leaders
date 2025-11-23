import React, { useEffect, useRef } from "react";
import MuteButton from "./MuteButton";
import CardDeck from "./CardDeck";
import GameInfo from "./GameInfo";
import GameBoard from "./GameBoard";

const Arena = () => {
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
    <div className="arena-container" onClick={handleUserInteraction}>
      {/* Background Music */}
      <audio ref={audioRef} loop>
        <source src="/medieval-kingdom-loop-366815.mp3" type="audio/mpeg" />
      </audio>

      {/* Background Image */}
      <div className="arena-background"></div>

      {/* Tempat Card - Kiri Tengah */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <CardDeck />
      </div>

      {/* Game Board dengan 37 Lingkaran - Tengah */}
      <GameBoard />

      {/* Info Seputar Game - Kanan Tengah */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <GameInfo />
      </div>

      {/* Mute Button */}
      <MuteButton audioRef={audioRef} />
    </div>
  );
};

export default Arena;
