// src/utils/skillConstants.js

export const BOARD_CONFIG = {
  1: 4,
  2: 5,
  3: 6,
  4: 7,
  5: 6,
  6: 5,
  7: 4,
};

export const RECRUITMENT_SPACES = {
  player: [
    "hex-1-4",
    "hex-2-5",
    "hex-3-6",
    "hex-4-7",
    "hex-5-6",
    "hex-6-5",
    "hex-7-4",
  ],
  enemy: [
    "hex-1-1",
    "hex-2-1",
    "hex-3-1",
    "hex-4-1",
    "hex-5-1",
    "hex-6-1",
    "hex-7-1",
  ],
};

export const CHARACTER_TYPES = {
  ACTIVE: [
    "Acrobate",
    "Cavalier",
    "Cogneur",
    "GardeRoyal",
    "LanceGrappin",
    "Manipulator",
    "Rodeuse",
    "Tavernier",
    "Illusionist",
  ],
  PASSIVE: ["Archer", "Assassin", "Geolier", "Protector", "Vizir"],
  SPECIAL: ["Nemesis", "VieilOurs"],
};

export const ABILITY_MODES = {
  ACROBATE_JUMP: "acrobate_jump",
  CAVALIER_MOVE: "cavalier_move",
  COGNEUR_SELECT_ENEMY: "cogneur_select_enemy",
  COGNEUR_SELECT_PUSH: "cogneur_select_push",
  GARDE_TELEPORT: "garde_teleport",
  GARDE_ADDITIONAL_MOVE: "garde_additional_move",
  LANCE_SELECT_TARGET: "lance_select_target",
  LANCE_SELECT_OPTION: "lance_select_option",
  MANIPULATOR_SELECT_TARGET: "manipulator_select_target",
  MANIPULATOR_SELECT_MOVE: "manipulator_select_move",
  RODEUSE_MOVE: "rodeuse_move",
  TAVERNIER_SELECT_ALLY: "tavernier_select_ally",
  TAVERNIER_SELECT_MOVE: "tavernier_select_move",
  ILLUSIONIST_SELECT_TARGET: "illusionist_select_target",
};
