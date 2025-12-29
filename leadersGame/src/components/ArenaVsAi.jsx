// ============================================
import React, { useEffect, useRef, useState } from "react";
import MuteButton from "./MuteButton";
import CardDeck from "./CardDeck";
import GameInfo from "./GameInfo";
import GameBoard from "./GameBoard";
import { Link } from "react-router-dom";
import { characterInfo } from "../data/characterInfo";

import * as SkillManager from "../skill/skillManager";
import * as SkillHandlers from "../skill/skillHandlers";
import * as SkillConstants from "../skill/skillConstants";

// This file is a manual copy of Arena.jsx adapted for AI-specific logic.
// Component renamed to ArenaVsAI so it does not import or reuse Arena.
const ArenaVsAI = () => {
    const audioRef = useRef(null);

    // === GAME STATE ===
    const [gamePhase, setGamePhase] = useState("placement");
    const [firstTurn, setFirstTurn] = useState(null);
    const [turn, setTurn] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [placedCards, setPlacedCards] = useState([]);
    const [playerColor, setPlayerColor] = useState(null);
    const [enemyColor, setEnemyColor] = useState(null);

    // === DECK STATE ===
    const [availableCards, setAvailableCards] = useState([]);
    const [deck, setDeck] = useState([]);

    // === BATTLE STATE ===
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [characterActions, setCharacterActions] = useState({});
    const [activeAbilityUsed, setActiveAbilityUsed] = useState({});
    const [validMovePositions, setValidMovePositions] = useState([]);
    const [currentPhase, setCurrentPhase] = useState("action");
    const [recruitmentCount, setRecruitmentCount] = useState(1);
    const [secondPlayerUsedBonus, setSecondPlayerUsedBonus] = useState(false);

    // === ACTIVE ABILITY STATE ===
    const [abilityMode, setAbilityMode] = useState(null);
    const [abilityData, setAbilityData] = useState({});

    // === RECRUITMENT STATE ===
    const [recruitmentPhase, setRecruitmentPhase] = useState({
        selectingCard: true,
        selectedRecruitmentCard: null,
        selectingPosition: false,
    });
    const [pendingOurson, setPendingOurson] = useState(null);

    const [bonusMoveActive, setBonusMoveActive] = useState(false);
    const [nemesisMustMove, setNemesisMustMove] = useState(null);

    // AI helper refs/state
    const aiThinking = useRef(false);
    const [aiBusy, setAiBusy] = useState(false);
    const originalHandlers = useRef({});

    // --- Initialization (same deck and initial placement as Arena) ---
    useEffect(() => {
        const allCards = [
            { type: "Acrobate", image: "/Composants_2D/Cartes/cartes_acrobate.jpg" },
            { type: "Archer", image: "/Composants_2D/Cartes/cartes_archer.jpg" },
            { type: "Assassin", image: "/Composants_2D/Cartes/cartes_assassin.jpg" },
            { type: "Cavalier", image: "/Composants_2D/Cartes/cartes_cavalier.jpg" },
            { type: "Cogneur", image: "/Composants_2D/Cartes/cartes_cogneur.jpg" },
            { type: "GardeRoyal", image: "/Composants_2D/Cartes/cartes_gardeRoyal.jpg" },
            { type: "Geolier", image: "/Composants_2D/Cartes/cartes_geolier.jpg" },
            { type: "Illusionist", image: "/Composants_2D/Cartes/cartes_illusionist.jpg" },
            { type: "LanceGrappin", image: "/Composants_2D/Cartes/cartes_lanceGrappin.jpg" },
            { type: "Manipulator", image: "/Composants_2D/Cartes/cartes_manipulator.jpg" },
            { type: "Nemesis", image: "/Composants_2D/Cartes/cartes_nemesis.jpg" },
            { type: "VieilOurs", image: "/Composants_2D/Cartes/cartes_oldBear.jpg" },
            { type: "Protector", image: "/Composants_2D/Cartes/cartes_protector.jpg" },
            { type: "Rodeuse", image: "/Composants_2D/Cartes/cartes_rodeuse.jpg" },
            { type: "Tavernier", image: "/Composants_2D/Cartes/cartes_tavernier.jpg" },
            { type: "Vizir", image: "/Composants_2D/Cartes/cartes_vizir.jpg" },
        ];

        const shuffledDeck = [...allCards].sort(() => Math.random() - 0.5);
        setAvailableCards(shuffledDeck.slice(0, 3));
        setDeck(shuffledDeck.slice(3));

        const randomFirst = Math.random() < 0.5 ? "player" : "enemy";
        setFirstTurn(randomFirst);
        setTurn(randomFirst);

        if (randomFirst === "player") {
            setPlayerColor("white");
            setEnemyColor("black");
        } else {
            setPlayerColor("black");
            setEnemyColor("white");
        }

        const playerKingImage =
            randomFirst === "player"
                ? "/Assets/Pions_personnages/Blanc/Leaders_BGA_white_LeaderRoi.png"
                : "/Assets/Pions_personnages/Noir/Leaders_BGA_black_LeaderRoi.png";

        const enemyKingImage =
            randomFirst === "enemy"
                ? "/Assets/Pions_personnages/Blanc/Leaders_BGA_white_LeaderReine.png"
                : "/Assets/Pions_personnages/Noir/Leaders_BGA_black_LeaderReine.png";

        setPlacedCards([
            {
                positionId: "hex-4-7",
                cardImage: playerKingImage,
                cardData: { type: "king", name: randomFirst === "player" ? "Roi" : "Roi" },
                owner: "player",
                isKing: true,
            },
            {
                positionId: "hex-4-1",
                cardImage: enemyKingImage,
                cardData: { type: "king", name: randomFirst === "enemy" ? "Reine" : "Reine" },
                owner: "enemy",
                isKing: true,
            },
        ]);

        // Start directly to battle phase as in Arena
        setGamePhase("battle");
        setCurrentPhase("action");
    }, []);

    // --- Copy of Arena handlers and UI ---
    // For accuracy and to keep UI identical to Arena, most handlers are copied from Arena.jsx.
    // AI-specific behavior should be implemented by modifying these handlers below.

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch((err) => {
                console.log("Auto-play prevented by browser:", err);
            });
        }
    }, []);

    const handleUserInteraction = () => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch((err) => console.log("Play failed:", err));
        }
    };

    // Keep core Arena functions so UI behaves the same; you can edit these for AI logic.
    const handleCardSelect = (card) => {
        if (gamePhase === "battle" && turn !== "player") return;
        if (gamePhase === "battle" && currentPhase === "recruitment") {
            if (recruitmentPhase.selectingCard) {
                setAvailableCards((prev) => prev.filter((c) => c.type !== card.type));
                setRecruitmentPhase({ selectingCard: false, selectedRecruitmentCard: card, selectingPosition: true });
                return;
            }
        }

        if (gamePhase === "placement") {
            setSelectedCard(card);
        }
    };

    const handleEndTurn = () => {
        if (gamePhase !== "battle") return;
        const newTurn = turn === "player" ? "enemy" : "player";
        const hasNemesis = placedCards.find((p) => p.cardData.type === "Nemesis" && p.owner === newTurn);
        const initialActions = hasNemesis ? { Nemesis: true } : {};
        setCurrentPhase("action");
        setCharacterActions(initialActions);
        setActiveAbilityUsed({});
        setAbilityMode(null);
        setAbilityData({});
        setSelectedCharacter(null);
        setSelectedCard(null);
        setRecruitmentCount(1);
        setRecruitmentPhase({ selectingCard: true, selectedRecruitmentCard: null, selectingPosition: false });
        setTurn(newTurn);
    };

    const handleEndActionPhase = () => {
        if (gamePhase !== "battle" || currentPhase !== "action") return;
        setSelectedCharacter(null);
        setValidMovePositions([]);
        setCurrentPhase("recruitment");
        checkSkipRecruitment();
    };

    // === USE ACTIVE ABILITY ===
    const handleUseActiveAbility = () => {
        if (!selectedCharacter || !selectedCharacter.positionId) {
            alert("Karakter harus berada di papan untuk menggunakan skill!");
            return;
        }

        const characterType = selectedCharacter.cardData.type;
        const isJailed = SkillManager.isAffectedByJailer(
            selectedCharacter.positionId,
            placedCards,
            turn
        );

        if (isJailed) {
            alert(
                "Skill tidak bisa digunakan! Karakter ini terkena efek Jailer (Geolier) lawan."
            );
            return; // stop, skill won't enter selection mode
        }

        // Check if already used
        if (activeAbilityUsed[characterType]) {
            return;
        }

        // Check if character has already acted
        if (characterActions[characterType]) {
            return;
        }

        try {
            let result;
            const config = SkillConstants.BOARD_CONFIG;

            switch (characterType) {
                case "Acrobate":
                    result = SkillHandlers.handleAcrobateAbility(
                        selectedCharacter,
                        placedCards,
                        config
                    );
                    break;
                case "Cavalier":
                    result = SkillHandlers.handleCavalierAbility(
                        selectedCharacter,
                        placedCards,
                        config
                    );
                    break;
                case "Cogneur":
                    result = SkillHandlers.handleCogneurAbility(
                        selectedCharacter,
                        placedCards,
                        turn,
                        config
                    );
                    break;
                case "GardeRoyal":
                    result = SkillHandlers.handleGardeRoyalAbility(
                        selectedCharacter,
                        placedCards,
                        turn,
                        config
                    );
                    break;
                case "LanceGrappin":
                    result = SkillHandlers.handleLanceGrappinAbility(
                        selectedCharacter,
                        placedCards,
                        config
                    );
                    break;
                case "Manipulator":
                    result = SkillHandlers.handleManipulatorAbility(
                        selectedCharacter,
                        placedCards,
                        turn,
                        config
                    );
                    break;
                case "Rodeuse":
                    result = SkillHandlers.handleRodeuseAbility(
                        selectedCharacter,
                        placedCards,
                        turn,
                        config
                    );
                    break;
                case "Tavernier":
                    result = SkillHandlers.handleTavernierAbility(
                        selectedCharacter,
                        placedCards,
                        turn,
                        config
                    );
                    break;
                case "Illusionist":
                    result = SkillHandlers.handleIllusionistAbility(
                        selectedCharacter,
                        placedCards,
                        config
                    );
                    break;
                default:
                    // For characters without special active ability logic
                    setActiveAbilityUsed({
                        ...activeAbilityUsed,
                        [characterType]: true,
                    });
                    setCharacterActions({
                        ...characterActions,
                        [characterType]: true,
                    });
                    setSelectedCharacter(null);
                    setValidMovePositions([]);
                    checkAutoAdvance();
                    return;
            }

            setAbilityMode(result.abilityMode);
            setValidMovePositions(result.validMovePositions);
            if (result.abilityData) {
                setAbilityData(result.abilityData);
            }
        } catch (error) {
            alert(error.message);
        }
    };

    // --- Other handlers copied from Arena.jsx (omitted here for brevity) ---
    // To keep the file concise, the full set of ability handlers and movement logic
    // from Arena.jsx can be added here. At this stage the component is a manual
    // duplicate of Arena's structure; modify the handlers above and below to
    // implement AI-specific behavior where needed.

    // === BATTLE PHASE HANDLERS (copied from Arena.jsx) ===
    const finishCharacterAction = (charType) => {
        setCharacterActions({ ...characterActions, [charType]: true });
        setSelectedCharacter(null);
        setValidMovePositions([]);
        setBonusMoveActive(false);
        checkAutoAdvance();
    };

    const getAdjacentPositions = (positionId) => {
        return SkillManager.getAdjacentPositions(positionId, SkillConstants.BOARD_CONFIG);
    };

    const getLeaderMoves = (leader, placedCardsParam) => {
        const adjacentPositions = getAdjacentPositions(leader.positionId);
        const emptyAdjacent = adjacentPositions.filter((posId) => !placedCardsParam.find((card) => card.positionId === posId));
        return emptyAdjacent;
    };

    const handleBattlePositionClick = (position) => {
        if (gamePhase !== "battle") return;

        if (nemesisMustMove) {
            handleNemesisMoveSelection(position);
            return;
        }

        if (currentPhase !== "action") return;

        if (abilityMode && selectedCharacter) {
            handleAbilityModeClick(position);
            return;
        }

        const clickedCharacter = placedCards.find((card) => card.positionId === position.id && card.owner === turn);

        if (clickedCharacter && !selectedCharacter && !characterActions[clickedCharacter.cardData.type]) {
            if (clickedCharacter.cardData.type === "Nemesis") {
                alert("Nemesis tidak bisa melakukan aksi di action phase. Nemesis hanya bergerak otomatis ketika Leader lawan bergerak!");
                return;
            }

            setSelectedCharacter(clickedCharacter);

            let validMoves;
            if (clickedCharacter.cardData.type === "king") {
                validMoves = getLeaderMoves(clickedCharacter, placedCards);
            } else {
                const adjacentPositions = getAdjacentPositions(clickedCharacter.positionId);
                validMoves = adjacentPositions.filter((posId) => !placedCards.find((card) => card.positionId === posId));
            }

            setValidMovePositions(validMoves);
            return;
        }

        if (selectedCharacter && !placedCards.find((card) => card.positionId === position.id)) {
            if (activeAbilityUsed[selectedCharacter.cardData.type]) {
                alert("Character ini sudah menggunakan active ability dan tidak bisa move!");
                return;
            }

            const adjacentPositions = getAdjacentPositions(selectedCharacter.positionId);

            if (validMovePositions.includes(position.id)) {
                if (selectedCharacter.cardData.type === "king") {
                    if (bonusMoveActive) {
                        let finalCards = placedCards.map((card) => card.positionId === selectedCharacter.positionId ? { ...card, positionId: position.id } : card);
                        finalCards = checkNemesisMovement(turn, finalCards);
                        setPlacedCards(finalCards);
                        finishCharacterAction(selectedCharacter.cardData.type);
                        setTimeout(() => checkWinCondition(), 100);
                    } else {
                        handleLeaderMove(selectedCharacter, position.id);
                    }
                } else {
                    const newPlacedCards = placedCards.map((card) => card.positionId === selectedCharacter.positionId ? { ...card, positionId: position.id } : card);
                    setPlacedCards(newPlacedCards);
                    const newActions = { ...characterActions, [selectedCharacter.cardData.type]: true };
                    setCharacterActions(newActions);
                    setSelectedCharacter(null);
                    setValidMovePositions([]);
                    setTimeout(() => checkWinCondition(), 100);
                    checkAutoAdvance(newPlacedCards, newActions);
                }
            } else {
                alert("Hanya bisa pindah ke posisi yang valid (ditandai ring biru)!");
            }
        }

        if (selectedCharacter && clickedCharacter === selectedCharacter) {
            setSelectedCharacter(null);
            setValidMovePositions([]);
        }
    };

    const handleLeaderMove = (leader, targetPos) => {
        const distance = SkillManager.getDistance(leader.positionId, targetPos);
        if (distance !== 1) { alert("Leader hanya bisa bergerak 1 petak per langkah."); return; }

        let updatedPlacedCards = placedCards.map((card) => card.positionId === leader.positionId ? { ...card, positionId: targetPos } : card);
        updatedPlacedCards = checkNemesisMovement(turn, updatedPlacedCards);
        setPlacedCards(updatedPlacedCards);

        const hasVizir = SkillHandlers.checkVizirEffect ? SkillHandlers.checkVizirEffect(targetPos, updatedPlacedCards, turn) : false;

        if (hasVizir) {
            setTimeout(() => {
                const mauLanjut = window.confirm("Vizir aktif! Apakah Leader ingin bergerak 1 petak lagi?");
                if (mauLanjut) {
                    const leaderBaru = { ...leader, positionId: targetPos };
                    setSelectedCharacter(leaderBaru);
                    const adjacentBaru = SkillManager.getAdjacentPositions(targetPos, SkillConstants.BOARD_CONFIG).filter((pos) => !updatedPlacedCards.some((c) => c.positionId === pos));
                    setValidMovePositions(adjacentBaru);
                    setBonusMoveActive(true);
                } else {
                    finishCharacterAction(leader.cardData.type);
                }
            }, 100);
        } else {
            finishCharacterAction(leader.cardData.type);
        }
    };

    const checkNemesisMovement = (leaderOwner, currentPlacedCards) => {
        const nemesisOwner = leaderOwner === "player" ? "enemy" : "player";
        const nemesis = currentPlacedCards.find((p) => p.cardData.type === "Nemesis" && p.owner === nemesisOwner);
        if (!nemesis) return currentPlacedCards;
        const opponentLeader = currentPlacedCards.find((p) => p.isKing && p.owner === leaderOwner);
        if (!opponentLeader) return currentPlacedCards;

        const nemesisMovement = SkillManager.calculateNemesisMovement(nemesis.positionId, opponentLeader.positionId, currentPlacedCards, SkillConstants.BOARD_CONFIG);
        if (!nemesisMovement.canMove) {
            setTimeout(() => { alert("⚔️ Nemesis tidak bisa bergerak karena tidak ada posisi valid!"); }, 100);
            return currentPlacedCards;
        }

        const selectablePositions = nemesisMovement.validPositions;

        setNemesisMustMove({ nemesis, validPositions: selectablePositions, pendingCards: currentPlacedCards, owner: nemesisOwner, originalTurn: leaderOwner });
        setValidMovePositions(selectablePositions);

        setTimeout(() => {
            const moveType = nemesisMovement.twoSpacePositions && nemesisMovement.twoSpacePositions.length > 0 ? "2 petak" : "1 petak";
            const ownerName = nemesisOwner === "player" ? "PLAYER" : "ENEMY";
            alert(`⚔️ INTERRUPT! ${ownerName}'s Nemesis harus bergerak ${moveType}!\n\nGiliran ${ownerName} untuk memilih posisi Nemesis.`);
        }, 100);

        return currentPlacedCards;
    };

    const handleNemesisMoveSelection = (position) => {
        if (!nemesisMustMove) return;
        const { nemesis, validPositions, pendingCards, owner } = nemesisMustMove;
        if (!validPositions.includes(position.id)) { alert("Posisi tidak valid! Pilih posisi yang di-highlight."); return; }

        const newPlacedCards = pendingCards.map((card) => card.positionId === nemesis.positionId ? { ...card, positionId: position.id } : card);
        setPlacedCards(newPlacedCards);
        setNemesisMustMove(null);
        setValidMovePositions([]);
        setAbilityMode(null);

        setTimeout(() => {
            if (bonusMoveActive && selectedCharacter?.cardData.type === "king") {
                // continue
            } else {
                if (selectedCharacter?.cardData.type === "king") finishCharacterAction("king");
            }
            checkWinCondition();
        }, 100);
    };

    const handleAbilityModeClick = (position) => {
        const config = SkillConstants.BOARD_CONFIG;
        switch (abilityMode) {
            case "acrobate_jump":
                handleAcrobateJumpMode(position, config);
                break;
            case "cavalier_move":
                handleCavalierMoveMode(position);
                break;
            case "cogneur_select_enemy":
                handleCogneurSelectEnemy(position, config);
                break;
            case "cogneur_select_push":
                handleCogneurSelectPush(position);
                break;
            case "garde_teleport":
                handleGardeTeleport(position, config);
                break;
            case "garde_additional_move":
                handleGardeAdditionalMove(position);
                break;
            case "lance_select_target":
                handleLanceSelectTarget(position, config);
                break;
            case "lance_select_option":
                handleLanceSelectOption(position, config);
                break;
            case "manipulator_select_target":
                handleManipulatorSelectTarget(position, config);
                break;
            case "manipulator_select_move":
                handleManipulatorSelectMove(position);
                break;
            case "rodeuse_move":
                handleRodeuseMove(position);
                break;
            case "tavernier_select_ally":
                handleTavernierSelectAlly(position, config);
                break;
            case "tavernier_select_move":
                handleTavernierSelectMove(position);
                break;
            case "illusionist_select_target":
                handleIllusionistSelectTarget(position);
                break;
            default:
                break;
        }
    };

    const handleAcrobateJumpMode = (position, config) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi jump yang valid!"); return; }
        const result = SkillHandlers.executeAcrobateJump(selectedCharacter, position.id, placedCards, abilityData, config);
        setPlacedCards(result.newPlacedCards);
        setSelectedCharacter({ ...selectedCharacter, positionId: position.id });
        setAbilityData(result.abilityData);
        if (result.shouldContinue) {
            const jumpAgain = window.confirm(`Jump ${result.abilityData.jumpCount}/2 selesai. Lakukan jump lagi?`);
            if (jumpAgain) { setValidMovePositions(result.nextValidPositions); return; }
        }
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleCavalierMoveMode = (position) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi 2 space yang valid!"); return; }
        const newPlacedCards = placedCards.map((card) => card.positionId === selectedCharacter.positionId ? { ...card, positionId: position.id } : card);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleCogneurSelectEnemy = (position, config) => {
        const enemy = placedCards.find((c) => c.positionId === position.id && c.owner !== turn);
        if (!enemy) { alert("Pilih musuh adjacent!"); return; }
        const pushPositions = SkillManager.getCogneurPushPositions(selectedCharacter.positionId, position.id, placedCards, config);
        if (pushPositions.length === 0) { alert("Tidak ada ruang untuk push musuh!"); resetAbilityMode(); return; }
        setAbilityMode("cogneur_select_push");
        setValidMovePositions(pushPositions);
        setAbilityData({ targetEnemy: position.id });
    };

    const handleCogneurSelectPush = (position) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi push yang valid!"); return; }
        const newPlacedCards = SkillHandlers.executeCogneurPush(selectedCharacter.positionId, abilityData.targetEnemy, position.id, placedCards, SkillConstants.BOARD_CONFIG);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleGardeTeleport = (position, config) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi adjacent ke Leader!"); return; }
        const result = SkillHandlers.executeGardeRoyalTeleport(selectedCharacter, position.id, placedCards, config);
        setPlacedCards(result.newPlacedCards);
        setSelectedCharacter({ ...selectedCharacter, positionId: position.id });
        if (result.canMoveAgain) {
            const moveAgain = window.confirm("Ingin bergerak 1 space tambahan?");
            if (moveAgain) { setAbilityMode("garde_additional_move"); setValidMovePositions(result.additionalMovePositions); return; }
        }
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleGardeAdditionalMove = (position) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi adjacent!"); return; }
        const newPlacedCards = placedCards.map((card) => card.positionId === selectedCharacter.positionId ? { ...card, positionId: position.id } : card);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleLanceSelectTarget = (position, config) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih karakter yang valid"); return; }
        const target = placedCards.find((c) => c.positionId === position.id);
        if (!target) { alert("Pilih karakter target!"); return; }
        const shouldMoveToTarget = window.confirm("Pilih aksi:\nOK - Pindah dekat target (Lance moves next to enemy)\nCancel - Tarik target jadi adjacent (Pull enemy close)");
        const newPlacedCards = SkillHandlers.executeLanceGrappin(selectedCharacter.positionId, position.id, shouldMoveToTarget, placedCards, config);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleLanceSelectOption = (position, config) => {
        const shouldMoveToTarget = window.confirm("Pilih aksi:\nOK - Pindah dekat target (Lance moves next to enemy)\nCancel - Tarik target jadi adjacent (Pull enemy close)");
        const newPlacedCards = SkillHandlers.executeLanceGrappin(selectedCharacter.positionId, abilityData.target, shouldMoveToTarget, placedCards, config);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleManipulatorSelectTarget = (position, config) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih musuh yang berada dalam 1 garis lurus!"); return; }
        const target = placedCards.find((c) => c.positionId === position.id && c.owner !== turn);
        if (!target) { alert("Pilih musuh target!"); return; }
        const adjacentToTarget = SkillManager.getAdjacentPositions(position.id, config);
        const emptyAdjacent = adjacentToTarget.filter((pos) => !placedCards.find((c) => c.positionId === pos));
        if (emptyAdjacent.length === 0) { alert("Tidak ada space kosong adjacent ke target!"); setAbilityMode(null); setValidMovePositions([]); return; }
        setAbilityMode("manipulator_select_move");
        setValidMovePositions(emptyAdjacent);
        setAbilityData({ target: position.id });
    };

    const handleManipulatorSelectMove = (position) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi adjacent kosong!"); return; }
        const newPlacedCards = placedCards.map((card) => card.positionId === abilityData.target ? { ...card, positionId: position.id } : card);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleRodeuseMove = (position) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi non-adjacent ke musuh!"); return; }
        const newPlacedCards = placedCards.map((card) => card.positionId === selectedCharacter.positionId ? { ...card, positionId: position.id } : card);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleTavernierSelectAlly = (position, config) => {
        if (!validMovePositions.includes(position.id)) { console.log("Karakter ini terlalu jauh dari Tavernier!"); return; }
        const ally = placedCards.find((c) => c.positionId === position.id && c.owner === turn);
        if (!ally) { alert("Pilih sekutu adjacent!"); return; }
        const adjacentToAlly = SkillManager.getAdjacentPositions(position.id, config);
        const emptyAdjacent = adjacentToAlly.filter((pos) => !placedCards.find((c) => c.positionId === pos) && pos !== selectedCharacter.positionId);
        if (emptyAdjacent.length === 0) { alert("Tidak ada space kosong untuk pindahkan sekutu!"); setAbilityMode(null); setValidMovePositions([]); return; }
        setAbilityMode("tavernier_select_move");
        setValidMovePositions(emptyAdjacent);
        setAbilityData({ ally: position.id });
    };

    const handleTavernierSelectMove = (position) => {
        if (!validMovePositions.includes(position.id)) { alert("Pilih posisi adjacent kosong!"); return; }
        const newPlacedCards = placedCards.map((card) => card.positionId === abilityData.ally ? { ...card, positionId: position.id } : card);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const handleIllusionistSelectTarget = (position) => {
        if (!validMovePositions.includes(position.id)) { alert("❌ Pilih karakter yang valid (dengan highlight PURPLE)!"); return; }
        const target = placedCards.find((c) => c.positionId === position.id);
        if (!target) { alert("Pilih karakter target!"); return; }
        const newPlacedCards = SkillHandlers.executeIllusionistSwitch(selectedCharacter.positionId, position.id, placedCards);
        setPlacedCards(newPlacedCards);
        finishAbility(selectedCharacter.cardData.type);
    };

    const finishAbility = (characterType) => {
        setActiveAbilityUsed({ ...activeAbilityUsed, [characterType]: true });
        setCharacterActions({ ...characterActions, [characterType]: true });
        resetAbilityMode();
        setTimeout(() => checkWinCondition(), 100);
        checkAutoAdvance();
    };

    const resetAbilityMode = () => {
        setAbilityMode(null);
        setValidMovePositions([]);
        setAbilityData({});
        setSelectedCharacter(null);
    };

    const checkAutoAdvance = (newPlacedCards = placedCards, newActions = characterActions) => {
        setTimeout(() => {
            const currentPlayerCharacters = newPlacedCards.filter((card) => card.owner === turn);
            const allCharactersActed = currentPlayerCharacters.every((character) => newActions[character.cardData.type]);
            if (allCharactersActed && currentPlayerCharacters.length > 0) {
                setCurrentPhase("recruitment");
                setSelectedCharacter(null);
                checkSkipRecruitment();
            }
        }, 200);
    };

    // Cek apakah perlu skip recruitment (maks 5 kartu termasuk king)
    const checkSkipRecruitment = () => {
        // Hitung karakter recruited (exclude King dan Ourson) — Arena logic keeps maxRecruited = 4
        const recruitedCount = placedCards.filter((p) => p.owner === turn && !p.isKing && !p.isOurson).length;

        // Max recruited per player (tidak termasuk king) = 4 -> total di papan termasuk king = 5
        const maxRecruited = 4;

        if (recruitedCount >= maxRecruited) {
            // Auto skip recruitment dan ganti turn
            setTimeout(() => {
                handleEndTurn();
            }, 500);
        } else {
            // Set recruitment count khusus untuk pemain kedua di turn pertama
            if (turn !== firstTurn && !secondPlayerUsedBonus && recruitmentCount === 1) {
                setRecruitmentCount(2);
                setSecondPlayerUsedBonus(true);
            }
        }
    };

    const handleOursonPlacement = (position) => {
        if (!pendingOurson) return;
        const recruitmentSpaces = SkillConstants.RECRUITMENT_SPACES[pendingOurson.owner === "player" ? "player" : "enemy"];
        if (!recruitmentSpaces.includes(position.id)) { alert("Ourson hanya bisa ditempatkan di recruitment space zona sendiri!"); return; }
        const isOccupied = placedCards.find((p) => p.positionId === position.id);
        if (isOccupied) { alert("Posisi sudah terisi!"); return; }
        const oursonImage = `/Assets/Pions_personnages/${pendingOurson.color === "white" ? "Blanc" : "Noir"}/Leaders_BGA_${pendingOurson.color === "white" ? "white" : "black"}_Ourson.png`;
        const newPlacedCards = [...placedCards, { positionId: position.id, cardImage: oursonImage, cardData: { type: "Ourson" }, owner: pendingOurson.owner, isKing: false, isOurson: true }];
        setPlacedCards(newPlacedCards);
        setPendingOurson(null);
        setRecruitmentPhase({ selectingCard: true, selectedRecruitmentCard: null, selectingPosition: false });
        if (turn !== firstTurn && recruitmentCount > 1) {
            setRecruitmentCount((prev) => prev - 1);
        } else {
            setTimeout(() => { handleEndTurn(); }, 500);
        }
    };

    const handleRecruitmentPositionSelect = (position) => {
        const { selectedRecruitmentCard } = recruitmentPhase;
        if (!selectedRecruitmentCard) return;
        const recruitmentSpaces = SkillConstants.RECRUITMENT_SPACES[turn === "player" ? "player" : "enemy"];
        if (!recruitmentSpaces.includes(position.id)) { alert("Hanya bisa menempatkan di recruitment space zona sendiri!"); return; }
        const isOccupied = placedCards.find((p) => p.positionId === position.id);
        if (isOccupied) { alert("Posisi sudah terisi!"); return; }
        const color = turn === "player" ? playerColor : enemyColor;
        const characterImage = `/Assets/Pions_personnages/${color === "white" ? "Blanc" : "Noir"}/Leaders_BGA_${color === "white" ? "white" : "black"}_${selectedRecruitmentCard.type}.png`;
        const newPlacedCards = [...placedCards, { positionId: position.id, cardImage: characterImage, cardData: selectedRecruitmentCard, owner: turn, isKing: false }];
        const newAvailableCards = availableCards.filter((availCard) => availCard.type !== selectedRecruitmentCard.type);
        let finalAvailableCards = newAvailableCards;
        let finalDeck = [...deck];
        if (deck.length > 0) { const newCard = deck[0]; finalAvailableCards = [...finalAvailableCards, newCard]; finalDeck = deck.slice(1); }
        finalAvailableCards = finalAvailableCards.sort(() => Math.random() - 0.5);
        setPlacedCards(newPlacedCards);
        setAvailableCards(finalAvailableCards);
        setDeck(finalDeck);
        if (selectedRecruitmentCard.type === "VieilOurs") {
            setPendingOurson({ owner: turn, color: color });
            setRecruitmentPhase({ selectingCard: false, selectedRecruitmentCard: null, selectingPosition: true });
            return;
        }
        if (turn !== firstTurn && recruitmentCount > 1) {
            setRecruitmentCount((prev) => prev - 1);
            setRecruitmentPhase({ selectingCard: true, selectedRecruitmentCard: null, selectingPosition: false });
        } else {
            setTimeout(() => { handleEndTurn(); }, 500);
        }
    };

    const checkWinCondition = () => {
        const playerKing = placedCards.find((p) => p.owner === "player" && p.isKing);
        const enemyKing = placedCards.find((p) => p.owner === "enemy" && p.isKing);

        const checkAssassin = (king, attackerOwner) => {
            if (!king) return false;
            return SkillHandlers.checkAssassinCapture ? SkillHandlers.checkAssassinCapture(king.positionId, placedCards, attackerOwner, SkillConstants.BOARD_CONFIG) : false;
        };

        const checkArcher = (king, attackerOwner) => {
            if (!king) return false;
            return SkillHandlers.checkArcherCapture ? SkillHandlers.checkArcherCapture(king.positionId, placedCards, attackerOwner, SkillConstants.BOARD_CONFIG) : false;
        };

        const checkNormalCapture = (king, attackerOwner) => {
            if (!king) return false;
            return SkillHandlers.checkNormalCapture ? SkillHandlers.checkNormalCapture(king.positionId, placedCards, attackerOwner, SkillConstants.BOARD_CONFIG) : false;
        };

        const checkSurrounded = (kingPos) => {
            if (!kingPos) return false;
            return SkillHandlers.checkSurrounded ? SkillHandlers.checkSurrounded(kingPos, placedCards, SkillConstants.BOARD_CONFIG) : false;
        };

        if (playerKing) {
            if (checkAssassin(playerKing, "enemy")) { setTimeout(() => { alert("🎉 Enemy wins! Player King captured by Assassin!"); }, 100); return; }
            if (checkArcher(playerKing, "enemy")) { setTimeout(() => { alert("🎉 Enemy wins! Player King captured with Archer!"); }, 100); return; }
            if (checkNormalCapture(playerKing, "enemy")) { setTimeout(() => { alert("🎉 Enemy wins! Player King captured!"); }, 100); return; }
            if (checkSurrounded(playerKing.positionId)) { setTimeout(() => { alert("🎉 Enemy wins! Player King surrounded!"); }, 100); return; }
        }

        if (enemyKing) {
            if (checkAssassin(enemyKing, "player")) { setTimeout(() => { alert("🎉 Player wins! Enemy King captured by Assassin!"); }, 100); return; }
            if (checkArcher(enemyKing, "player")) { setTimeout(() => { alert("🎉 Player wins! Enemy King captured with Archer!"); }, 100); return; }
            if (checkNormalCapture(enemyKing, "player")) { setTimeout(() => { alert("🎉 Player wins! Enemy King captured!"); }, 100); return; }
            if (checkSurrounded(enemyKing.positionId)) { setTimeout(() => { alert("🎉 Player wins! Enemy King surrounded!"); }, 100); return; }
        }
    };

    const handlePositionClick = (position) => {
        // Block clicks when it's enemy's turn
        if (gamePhase === "battle" && turn !== "player") return;

        if (gamePhase === "placement") {
            // Placement logic same as Arena
            if (!selectedCard) { alert("Pilih card terlebih dahulu!"); return; }
            if (position.zone !== turn) { alert(`Hanya bisa menempatkan di zona ${turn}!`); return; }
            const isOccupied = placedCards.find((p) => p.positionId === position.id);
            if (isOccupied) { alert("Posisi sudah terisi!"); return; }
            const deployedCount = placedCards.filter((p) => p.owner === turn && !p.isKing && !p.isOurson).length;
            const maxCharacters = 4;
            if (deployedCount >= maxCharacters) { alert(`Maksimal ${maxCharacters} character recruited (tidak termasuk king)!`); return; }
            const color = turn === "player" ? playerColor : enemyColor;
            const colorPrefix = color === "white" ? "white" : "black";
            const characterImage = `/Assets/Pions_personnages/${color === "white" ? "Blanc" : "Noir"}/Leaders_BGA_${colorPrefix}_${selectedCard.type}.png`;
            const newPlacedCards = [...placedCards, { positionId: position.id, cardImage: characterImage, cardData: selectedCard, owner: turn, isKing: false }];
            const newAvailableCards = availableCards.filter((card) => card.type !== selectedCard.type);
            let finalAvailableCards = newAvailableCards;
            let finalDeck = [...deck];
            if (deck.length > 0) { const newCard = deck[0]; finalAvailableCards = [...newAvailableCards, newCard]; finalDeck = deck.slice(1); }
            finalAvailableCards = finalAvailableCards.sort(() => Math.random() - 0.5);
            setPlacedCards(newPlacedCards);
            setAvailableCards(finalAvailableCards);
            setDeck(finalDeck);
            setSelectedCard(null);
            setTurn(turn === "player" ? "enemy" : "player");
            const playerChars = newPlacedCards.filter((p) => p.owner === "player").length;
            const enemyChars = newPlacedCards.filter((p) => p.owner === "enemy").length;
            if (playerChars >= 5 && enemyChars >= 5) { setTimeout(() => { alert("Deployment selesai! Battle dimulai!"); setGamePhase("battle"); setCurrentPhase("action"); }, 500); }
        } else if (gamePhase === "battle") {
            if (currentPhase === "action") {
                // Forward to full battle click handler (same as Arena)
                handleBattlePositionClick(position);
            } else if (currentPhase === "recruitment") {
                if (recruitmentPhase.selectingPosition) {
                    if (pendingOurson) handleOursonPlacement(position);
                    else handleRecruitmentPositionSelect(position);
                }
            }
        }
    };

    // --- AI Turn System ---
    const handleEndTurnForAI = () => {
        // Reset state for player turn
        setCurrentPhase("action");
        setCharacterActions({});
        setActiveAbilityUsed({});
        setAbilityMode(null);
        setAbilityData({});
        setSelectedCharacter(null);
        setSelectedCard(null);
        setRecruitmentCount(1);
        setRecruitmentPhase({ selectingCard: true, selectedRecruitmentCard: null, selectingPosition: false });
        setTurn("player");
        aiThinking.current = false;
        setAiBusy(false);
    };

    const aiActionPhase = () => {
        // Find enemy characters that haven't acted (include king)
        const enemies = placedCards.filter((p) => p.owner === "enemy" && !characterActions[p.cardData.type]);

        if (enemies.length === 0) {
            // No enemies to act -> go to recruitment
            setCurrentPhase("recruitment");
            // Ensure recruitmentCount / second-player bonus is applied
            checkSkipRecruitment();
            aiThinking.current = false;
            setAiBusy(false);
            return;
        }

        // Choose a random available enemy to act (including king) to vary behavior
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];

        // Compute valid moves depending on character type
        let validMoves = [];
        const occupiedPositions = new Set(placedCards.map((p) => p.positionId));

        try {
            switch (enemy.cardData.type) {
                case "Cavalier":
                    validMoves = SkillManager.getCavalierValidMoves(
                        enemy.positionId,
                        placedCards,
                        SkillConstants.BOARD_CONFIG
                    );
                    break;
                case "Acrobate":
                    // Acrobate moves like normal (adjacent) during action phase; jump is an active ability
                    validMoves = SkillManager.getAdjacentPositions(
                        enemy.positionId,
                        SkillConstants.BOARD_CONFIG
                    ).filter((pos) => !occupiedPositions.has(pos));
                    break;
                case "Rodeuse":
                    validMoves = SkillManager.getRodeuseValidMoves(
                        enemy.positionId,
                        placedCards,
                        "enemy",
                        SkillConstants.BOARD_CONFIG
                    );
                    break;
                default:
                    // Default: adjacent empty positions
                    validMoves = SkillManager.getAdjacentPositions(
                        enemy.positionId,
                        SkillConstants.BOARD_CONFIG
                    ).filter((pos) => !occupiedPositions.has(pos));
                    break;
            }
        } catch (err) {
            validMoves = [];
        }

        // If enemy is king, allow leader moves (1-step adjacent or Vizir handled separately)
        if (enemy.isKing) {
            try {
                validMoves = getLeaderMoves(enemy, placedCards);
            } catch (e) {
                // fallback to adjacent
                validMoves = SkillManager.getAdjacentPositions(enemy.positionId, SkillConstants.BOARD_CONFIG).filter((pos) => !occupiedPositions.has(pos));
            }
        }

        // If no valid moves, mark as acted and continue
        if (!validMoves || validMoves.length === 0) {
            setCharacterActions((prev) => ({ ...prev, [enemy.cardData.type]: true }));
            aiThinking.current = false;
            setTimeout(() => setAiBusy(false), 200);
            return;
        }

        // Choose move using an epsilon-greedy approach: usually pick the aggressive best move,
        // sometimes pick a random valid move to avoid deterministic behavior.
        const playerPositions = placedCards.filter((p) => p.owner === "player").map((p) => p.positionId);

        // BFS shortest path distance treating occupied positions as walls (except target)
        const getPathDistance = (start, target, placedCardsList) => {
            const occupied = new Set(placedCardsList.map((p) => p.positionId));
            const queue = [[start, 0]];
            const seen = new Set([start]);
            while (queue.length > 0) {
                const [pos, dist] = queue.shift();
                if (pos === target) return dist;
                const neighbors = SkillManager.getAdjacentPositions(pos, SkillConstants.BOARD_CONFIG) || [];
                for (const n of neighbors) {
                    if (seen.has(n)) continue;
                    // allow stepping onto target even if occupied (capture), otherwise neighbor must be empty
                    if (n !== target && occupied.has(n)) continue;
                    seen.add(n);
                    queue.push([n, dist + 1]);
                }
            }
            return Infinity;
        };

        const evaluateMove = (move) => {
            // lower is better
            let base = 0;
            if (playerPositions.length === 0) base = 0;
            else {
                const dists = playerPositions.map((pp) => getPathDistance(move, pp, placedCards));
                base = Math.min(...dists);
            }

            // simulate the placement after move
            const simulated = placedCards.map((p) => (p.positionId === enemy.positionId ? { ...p, positionId: move } : p));

            // big bonus if this move enables immediate capture of player's king
            let kingCaptureBonus = 0;
            const playerKing = simulated.find((p) => p.owner === "player" && p.isKing);
            if (playerKing) {
                try {
                    if (SkillHandlers.checkAssassinCapture && SkillHandlers.checkAssassinCapture(playerKing.positionId, simulated, "enemy", SkillConstants.BOARD_CONFIG)) kingCaptureBonus = 1000;
                    if (SkillHandlers.checkArcherCapture && SkillHandlers.checkArcherCapture(playerKing.positionId, simulated, "enemy", SkillConstants.BOARD_CONFIG)) kingCaptureBonus = 1000;
                    if (SkillHandlers.checkNormalCapture && SkillHandlers.checkNormalCapture(playerKing.positionId, simulated, "enemy", SkillConstants.BOARD_CONFIG)) kingCaptureBonus = 1000;
                } catch (e) {
                    // ignore
                }
            }

            // vulnerability penalty: how many player pieces adjacent to the moved position
            const vulnerability = placedCards.filter((p) => p.owner === "player" && SkillManager.isAdjacent(p.positionId, move, SkillConstants.BOARD_CONFIG)).length;

            const score = base - kingCaptureBonus + vulnerability * 3; // lower is better
            return score;
        };

        // pick best according to evaluation (lower score preferred)
        let best = validMoves[0];
        let bestScore = evaluateMove(best);
        for (const m of validMoves) {
            const s = evaluateMove(m);
            if (s < bestScore) {
                best = m;
                bestScore = s;
            }
        }

        // epsilon-greedy: usually pick best, sometimes random to keep variety
        const pickBestProb = 0.75;
        const chosenMove = Math.random() < pickBestProb ? best : validMoves[Math.floor(Math.random() * validMoves.length)];

        // Show selection + highlights first (mimic player UX)
        setSelectedCharacter(enemy);
        setValidMovePositions(validMoves);

        setTimeout(() => {
            const newPlaced = placedCards.map((p) => p.positionId === enemy.positionId ? { ...p, positionId: chosenMove } : p);
            setPlacedCards(newPlaced);
            setCharacterActions((prev) => ({ ...prev, [enemy.cardData.type]: true }));
            // clear selection/highlight
            setSelectedCharacter(null);
            setValidMovePositions([]);
            // allow next AI step after short delay
            aiThinking.current = false;
            setAiBusy(false);
        }, 700);
    };

    const aiRecruitmentPhase = () => {
        // simple recruitment: pick a random available card and an empty recruitment space
        // Enforce max 5 per side (including king): if enemy already has 4 recruited (excluding king/ourson), skip recruitment
        const enemyRecruitedCount = placedCards.filter((p) => p.owner === "enemy" && !p.isKing && !p.isOurson).length;
        const maxRecruited = 4;
        if (enemyRecruitedCount >= maxRecruited) {
            handleEndTurnForAI();
            return;
        }
        if (availableCards.length === 0) {
            handleEndTurnForAI();
            return;
        }

        // choose random card
        const cardToRecruit = availableCards[Math.floor(Math.random() * availableCards.length)];
        const recruitmentSpaces = SkillConstants.RECRUITMENT_SPACES["enemy"] || [];
        const emptySpaces = recruitmentSpaces.filter((pos) => !placedCards.find((p) => p.positionId === pos));

        if (emptySpaces.length === 0) {
            handleEndTurnForAI();
            return;
        }

        // choose among top candidates near player's pieces (prefer aggressive placement), but randomize
        const playerPositions = placedCards.filter((p) => p.owner === "player").map((p) => p.positionId);
        const scorePos = (p) => {
            if (playerPositions.length === 0) return 0;
            const dists = playerPositions.map((pp) => SkillManager.getDistance(p, pp));
            return Math.min(...dists);
        };
        const sorted = [...emptySpaces].sort((a, b) => scorePos(a) - scorePos(b));
        const topN = sorted.slice(0, Math.min(2, sorted.length));
        const pos = topN[Math.floor(Math.random() * topN.length)];
        const characterImage = `/Assets/Pions_personnages/${enemyColor === "white" ? "Blanc" : "Noir"}/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_${cardToRecruit.type}.png`;

        // If VieilOurs, place Ourson immediately for AI
        if (cardToRecruit.type === "VieilOurs") {
            const oursonImage = `/Assets/Pions_personnages/${enemyColor === "white" ? "Blanc" : "Noir"}/Leaders_BGA_${enemyColor === "white" ? "white" : "black"}_Ourson.png`;
            const newPlacedWithOurson = [...placedCards, { positionId: pos, cardImage: oursonImage, cardData: { type: "Ourson" }, owner: "enemy", isKing: false, isOurson: true }];
            const newAvailable = availableCards.filter(av => av.type !== cardToRecruit.type);
            let finalAvailable = newAvailable;
            let finalDeck = [...deck];
            if (deck.length > 0) { finalAvailable = [...finalAvailable, deck[0]]; finalDeck = deck.slice(1); }
            finalAvailable = finalAvailable.sort(() => Math.random() - 0.5);

            setPlacedCards(newPlacedWithOurson);
            setAvailableCards(finalAvailable);
            setDeck(finalDeck);

            if (turn !== firstTurn && recruitmentCount > 1) {
                setRecruitmentCount((prev) => prev - 1);
                setRecruitmentPhase({ selectingCard: true, selectedRecruitmentCard: null, selectingPosition: false });
                // allow AI to continue recruitment loop
                aiThinking.current = false;
            } else {
                setTimeout(() => handleEndTurnForAI(), 600);
            }

            return;
        }

        const newPlaced = [...placedCards, { positionId: pos, cardImage: characterImage, cardData: cardToRecruit, owner: "enemy", isKing: false }];
        const newAvailable = availableCards.filter(av => av.type !== cardToRecruit.type);
        let finalAvailable = newAvailable;
        let finalDeck = [...deck];
        if (deck.length > 0) { finalAvailable = [...finalAvailable, deck[0]]; finalDeck = deck.slice(1); }
        finalAvailable = finalAvailable.sort(() => Math.random() - 0.5);

        setPlacedCards(newPlaced);
        setAvailableCards(finalAvailable);
        setDeck(finalDeck);

        if (turn !== firstTurn && recruitmentCount > 1) {
            setRecruitmentCount((prev) => prev - 1);
            setRecruitmentPhase({ selectingCard: true, selectedRecruitmentCard: null, selectingPosition: false });
            // allow AI to continue recruitment loop
            aiThinking.current = false;
        } else {
            // End AI turn after recruitment
            setTimeout(() => handleEndTurnForAI(), 600);
        }
    };

    const runAITurn = () => {
        if (currentPhase === "action") aiActionPhase();
        else if (currentPhase === "recruitment") aiRecruitmentPhase();
        else aiThinking.current = false;
    };

    useEffect(() => {
        if (gamePhase !== "battle" || turn !== "enemy" || aiThinking.current) return;
        aiThinking.current = true;
        setAiBusy(true);
        // small delay to simulate thinking
        setTimeout(() => runAITurn(), 700);
    }, [gamePhase, turn, currentPhase, placedCards, availableCards, characterActions]);

    return (
        <div className="arena-container" onClick={handleUserInteraction}>
            <audio ref={audioRef} loop>
                <source src="/medieval-kingdom-loop-366815.mp3" type="audio/mpeg" />
            </audio>

            <div className="arena-background"></div>

            <div className="absolute top-4 left-4 z-20">
                <Link to="/" className="kingdom-btn text-center px-6 py-2">Back to Menu</Link>
            </div>

            <div className="absolute left-30 top-1/2 -translate-y-1/2 z-10">
                <CardDeck
                    availableCards={availableCards}
                    onCardSelect={handleCardSelect}
                    selectedCard={selectedCard}
                    deckCount={deck.length}
                    disabled={gamePhase === "battle" && currentPhase === "action"}
                />
            </div>

            <GameBoard
                placedCards={placedCards}
                selectedCard={selectedCard}
                selectedCharacter={selectedCharacter}
                turn={turn}
                gamePhase={gamePhase}
                onPositionClick={handlePositionClick}
                recruitmentPhase={recruitmentPhase}
                activeAbilityUsed={activeAbilityUsed}
                validMovePositions={validMovePositions}
                abilityMode={abilityMode}
            />

            <div className="absolute top-4 translate-x-150 z-20 bg-black/80 px-6 py-3 rounded-lg border-2 border-yellow-400">
                <p className="text-yellow-300 text-lg font-bold">
                    {gamePhase === "placement" && `⚔️ Character Placement - ${turn === "player" ? "Player" : "Enemy"} Turn`}
                    {gamePhase === "battle" && nemesisMustMove && (
                        <span className="text-red-400">⚔️ NEMESIS INTERRUPT! - {nemesisMustMove.owner === "player" ? "PLAYER" : "ENEMY"} pilih posisi Nemesis</span>
                    )}
                    {gamePhase === "battle" && !nemesisMustMove && `⚡ Battle Phase - ${(turn === "player" && playerColor === "white") || (turn === "enemy" && enemyColor === "white") ? "⚪ White's" : "⚫ Black's"} Turn - ${currentPhase === "action" ? "Action Phase" : "Recruitment Phase"}`}
                </p>
                {firstTurn && (<p className="text-white text-sm mt-1">Player: {playerColor === "white" ? "⚪ White (Roi)" : "⚫ Black (Roi)"} | Enemy: {enemyColor === "white" ? "⚪ White (Reine)" : "⚫ Black (Reine)"}</p>)}

                {gamePhase === "battle" && currentPhase === "action" && (
                    <div className="mt-2">
                        {/* Ability Mode Indicator */}
                        {abilityMode && (
                            <div className="mb-2 p-2 bg-purple-900/60 border border-purple-400 rounded">
                                <p className="text-purple-300 text-sm font-bold">
                                    {abilityMode === "acrobate_jump" && "🤸 Acrobate Jump Mode"}
                                    {abilityMode === "cavalier_move" && "♟️ Cavalier 2-Space Move"}
                                    {abilityMode === "cogneur_select_enemy" && "💥 Cogneur - Select Enemy"}
                                    {abilityMode === "cogneur_select_push" && "💥 Cogneur - Select Push Direction"}
                                    {abilityMode === "garde_teleport" && "🛡️ Garde Royal - Teleport"}
                                    {abilityMode === "garde_additional_move" && "🛡️ Garde Royal - Additional Move"}
                                    {abilityMode === "lance_select_target" && "🎣 Lance Grappin - Select Target"}
                                    {abilityMode === "lance_select_option" && "🎣 Lance Grappin - Select Action"}
                                    {abilityMode === "manipulator_select_target" && "🌀 Manipulator - Select Target"}
                                    {abilityMode === "manipulator_select_move" && "🌀 Manipulator - Select Move"}
                                    {abilityMode === "rodeuse_move" && "👣 Rodeuse - Select Position"}
                                    {abilityMode === "tavernier_select_ally" && "🍺 Tavernier - Select Ally"}
                                    {abilityMode === "tavernier_select_move" && "🍺 Tavernier - Select Move"}
                                    {abilityMode === "illusionist_select_target" && "🔮 Illusionist - Select Target"}
                                </p>
                                <p className="text-purple-200 text-xs">Click posisi yang valid (ditandai dengan ring biru)</p>
                            </div>
                        )}

                        {selectedCharacter && !abilityMode && (
                            <p className="text-green-400 text-sm mt-1">Selected: {selectedCharacter.cardData.type} - Click adjacent empty space to move</p>
                        )}
                        <p className="text-yellow-400 text-xs mt-1">Actions left: {placedCards.filter((card) => card.owner === turn && !characterActions[card.cardData.type]).length}</p>

                        {selectedCharacter && !abilityMode && characterInfo[selectedCharacter.cardData.type]?.category === "Active" && (
                            <button
                                onClick={handleUseActiveAbility}
                                disabled={activeAbilityUsed[selectedCharacter.cardData.type]}
                                className={`mt-2 w-full px-4 py-2 font-bold rounded-lg border-2 shadow-lg transition-all duration-300 ${activeAbilityUsed[selectedCharacter.cardData.type] ? "bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-purple-400 hover:scale-105"}`}
                            >
                                {activeAbilityUsed[selectedCharacter.cardData.type] ? "✓ Ability Used" : "⚡ Use Active Ability"}
                            </button>
                        )}

                        {!abilityMode && (
                            <button
                                onClick={handleEndActionPhase}
                                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold rounded-lg border-2 border-yellow-400 shadow-lg transition-all duration-300 hover:scale-105"
                            >
                                End Action Phase
                            </button>
                        )}
                        {aiBusy && <div className="text-white text-sm mt-2">Enemy thinking...</div>}
                    </div>
                )}

                {gamePhase === "battle" && currentPhase === "recruitment" && (
                    <div className="mt-2">
                        {recruitmentPhase.selectingPosition ? (
                            <p className="text-green-400 text-sm">{pendingOurson ? "🐻 Tempatkan Ourson di recruitment space (lingkaran emas)" : `Pilih posisi di recruitment space (lingkaran emas) untuk menempatkan ${recruitmentPhase.selectedRecruitmentCard?.type}`}</p>
                        ) : (
                            <p className="text-blue-400 text-sm">{placedCards.filter((p) => p.owner === turn).length >= 5 ? "Max characters reached - Auto skipping..." : "Pilih kartu untuk recruit"}</p>
                        )}
                        {aiBusy && <div className="text-white text-sm mt-2">Enemy thinking...</div>}
                    </div>
                )}
            </div>

            <div className="absolute right-8 top-3/5 -translate-y-1/2 z-10">
                <GameInfo placedCards={placedCards} turn={turn} playerColor={playerColor} enemyColor={enemyColor} />
            </div>

            <MuteButton audioRef={audioRef} />
        </div>
    );
};

export default ArenaVsAI;