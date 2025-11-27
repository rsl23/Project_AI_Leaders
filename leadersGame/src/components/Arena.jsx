import React, { useEffect, useRef, useState } from "react";
import MuteButton from "./MuteButton";
import CardDeck from "./CardDeck";
import GameInfo from "./GameInfo";
import GameBoard from "./GameBoard";

const Arena = () => {
  const audioRef = useRef(null);

  // === GAME STATE ===
  const [gamePhase, setGamePhase] = useState("placement"); // placement -> battle
  const [firstTurn, setFirstTurn] = useState(null); // player or enemy (siapa yang mulai duluan)
  const [turn, setTurn] = useState(null); // player or enemy
  const [selectedCard, setSelectedCard] = useState(null);
  const [placedCards, setPlacedCards] = useState([]);
  const [playerColor, setPlayerColor] = useState(null); // "white" or "black"
  const [enemyColor, setEnemyColor] = useState(null); // "white" or "black"

  // === INITIALIZE GAME: Random turn & Place Kings ===
  useEffect(() => {
    // Random siapa yang mulai duluan
    const randomFirst = Math.random() < 0.5 ? "player" : "enemy";
    setFirstTurn(randomFirst);
    setTurn(randomFirst);

    // Assign warna berdasarkan siapa yang duluan
    if (randomFirst === "player") {
      setPlayerColor("white"); // Player duluan = White = Roi
      setEnemyColor("black"); // Enemy ke-2 = Black = Roi
    } else {
      setPlayerColor("black"); // Player ke-2 = Black = Roi
      setEnemyColor("white"); // Enemy duluan = White = Reine
    }

    // Tempatkan kedua King otomatis
    const playerKingImage =
      randomFirst === "player"
        ? "/Assets/Pions_personnages/Blanc/Leaders_BGA_white_LeaderRoi.png" // Player duluan = White Roi
        : "/Assets/Pions_personnages/Noir/Leaders_BGA_black_LeaderRoi.png"; // Player ke-2 = Black Roi

    const enemyKingImage =
      randomFirst === "enemy"
        ? "/Assets/Pions_personnages/Blanc/Leaders_BGA_white_LeaderReine.png" // Enemy duluan = White Reine
        : "/Assets/Pions_personnages/Noir/Leaders_BGA_black_LeaderReine.png"; // Enemy ke-2 = Black Reine

    setPlacedCards([
      {
        positionId: "hex-4-7", // Player king position (kanan)
        cardImage: playerKingImage,
        cardData: {
          type: "king",
          name: randomFirst === "player" ? "Roi" : "Roi",
        },
        owner: "player",
        isKing: true,
      },
      {
        positionId: "hex-4-1", // Enemy king position (kiri)
        cardImage: enemyKingImage,
        cardData: {
          type: "king",
          name: randomFirst === "enemy" ? "Reine" : "Reine",
        },
        owner: "enemy",
        isKing: true,
      },
    ]);

    // Tampilkan notifikasi
    setTimeout(() => {
      alert(
        `${
          randomFirst === "player" ? "Player" : "Enemy"
        } mendapat giliran pertama!\n\nPlayer = ${
          randomFirst === "player" ? "White (Roi)" : "Black (Roi)"
        }\nEnemy = ${
          randomFirst === "enemy" ? "White (Reine)" : "Black (Reine)"
        }`
      );
    }, 500);
  }, []);

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

  // === GAME HANDLERS ===
  const handleCardSelect = (card) => {
    setSelectedCard(card);
  };

  const handlePositionClick = (position) => {
    if (!selectedCard) {
      alert("Pilih card terlebih dahulu!");
      return;
    }

    // Tidak bisa menaruh di posisi king
    if (position.place === "king") {
      alert("Posisi king tidak bisa diisi character lain!");
      return;
    }

    // PHASE: NORMAL PLACEMENT (6 character per side)
    if (gamePhase === "placement") {
      // Validasi zona sesuai turn
      if (position.zone !== turn) {
        alert(`Hanya bisa menempatkan di zona ${turn}!`);
        return;
      }

      const isOccupied = placedCards.find((p) => p.positionId === position.id);
      if (isOccupied) {
        alert("Posisi sudah terisi!");
        return;
      }

      // Hitung jumlah deployed (exclude king)
      const deployedCount = placedCards.filter(
        (p) => p.owner === turn && !p.isKing
      ).length;

      if (deployedCount >= 4) {
        alert("Maksimal 5 character (termasuk king)!");
        return;
      }

      // Tempatkan Character dengan gambar sesuai warna
      const color = turn === "player" ? playerColor : enemyColor;
      const colorPrefix = color === "white" ? "white" : "black";
      const characterImage = `/Assets/Pions_personnages/${
        color === "white" ? "Blanc" : "Noir"
      }/Leaders_BGA_${colorPrefix}_${selectedCard.type}.png`;

      setPlacedCards([
        ...placedCards,
        {
          positionId: position.id,
          cardImage: characterImage,
          cardData: selectedCard,
          owner: turn,
          isKing: false,
        },
      ]);

      setSelectedCard(null);
      setTurn(turn === "player" ? "enemy" : "player");

      // Cek apakah deployment selesai (7 player + 7 enemy)
      if (placedCards.length === 10) {
        setTimeout(() => {
          alert("Deployment selesai! Battle dimulai!");
          setGamePhase("battle");
        }, 500);
      }
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
        <CardDeck onCardSelect={handleCardSelect} selectedCard={selectedCard} />
      </div>

      {/* Game Board dengan 37 Lingkaran - Tengah */}
      <GameBoard
        placedCards={placedCards}
        selectedCard={selectedCard}
        turn={turn}
        gamePhase={gamePhase}
        onPositionClick={handlePositionClick}
      />

      {/* Phase Indicator */}
      <div className="absolute top-4 translate-x-150 z-20 bg-black/80 px-6 py-3 rounded-lg border-2 border-yellow-400">
        <p className="text-yellow-300 text-lg font-bold">
          {gamePhase === "placement" &&
            `⚔️ Character Placement - ${
              turn === "player" ? "Player" : "Enemy"
            } Turn`}
          {gamePhase === "battle" &&
            `⚡ Battle Phase - ${turn === "player" ? "Player" : "Enemy"} Turn`}
        </p>
        {firstTurn && (
          <p className="text-white text-sm mt-1">
            Player:{" "}
            {playerColor === "white" ? "⚪ White (Roi)" : "⚫ Black (Roi)"} |
            Enemy:{" "}
            {enemyColor === "white" ? "⚪ White (Reine)" : "⚫ Black (Reine)"}
          </p>
        )}
      </div>

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
