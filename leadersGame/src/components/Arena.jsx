import React, { useEffect, useRef } from "react";
import MuteButton from "./MuteButton";

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

      <img
        src="../../public/Assets BGA/Leaders_Board.png"
        alt="Leaders Game Board"
        className="game-board"
      />

      {/* Mute Button */}
      <MuteButton audioRef={audioRef} />
    </div>
  );
};

export default Arena;
