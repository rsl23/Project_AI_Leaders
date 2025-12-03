// Data informasi untuk setiap karakter
// Silakan edit deskripsi, abilities, dan stats sesuai kebutuhan

export const characterInfo = {
  Acrobate: {
    name: "Acrobate",
    description:
      "Jump in a straight line past the character next to him. Can do up to two consecutive jumps.",
    category: "Active",
  },
  Archer: {
    name: "Archer",
    description:
      "Helps capture the opponents's Leader from two spaces away in a straight line, even if they are not visible. Cannot help capture if adjacent.",
    category: "Passive",
  },
  Assassin: {
    name: "Assassin",
    description:
      "Capture the opposing Leader, even without any other participating allies.",
    category: "Passive",
  },
  Cavalier: {
    name: "Cavalier",
    description: "Moves two spaces in a straight line.",
    category: "Active",
  },
  Cogneur: {
    name: "Cogneur",
    description:
      "Moves to an adjacent enemy's space, pushing them to one of the opposite three spaces of your choice.",
    category: "Active",
  },
  GardeRoyal: {
    name: "Garde Royal",
    description:
      "Moves to a space adjacent to your Leader, then MAY move one space.",
    category: "Active",
  },
  Geolier: {
    name: "Geolier",
    description: "Adjacent enemies cannot use their ACTIVE ABILITES",
    category: "Passive",
  },
  Illusionist: {
    name: "Illusionist",
    description:
      "Switches places with a non-adjacent, visible champion in a straight line.",
    category: "Active",
  },
  LanceGrappin: {
    name: "Lance Grappin",
    description:
      "Moves in a straight line all the way to a visible character, OR drags them until they are adjacent",
    category: "Active",
  },
  Manipulator: {
    name: "Manipulator",
    description:
      "Moves a non-adjacent enemy, visible in a straight line, by one space.",
    category: "Active",
  },
  Nemesis: {
    name: "Nemesis",
    description:
      "Cannot take an action during their action phase. During your turn or your opponent’s turn, after any action moving the opponent’s Leader (one or more spaces), the Nemesis MUST move two spaces. The Nemesis cannot move away and back to their current space. If the Nemesis cannot move two spaces, move the Nemesis only one space. If that is not possible either, the Nemesis does not move.",
    category: "Special",
  },
  VieilOurs: {
    name: "Vieil Ours",
    description:
      "When you recruit them, take both the Hermit and the Cub and place each on an empty recruitment space (not necessarily adjacent). These two characters count as one during the recruitment phase. During the action phase, you can move either the Hermit or the Cub, or one after another. The cub cannot help capture the opponent’s Leader.",
    category: "Special",
  },
  Protector: {
    name: "Protector",
    description:
      "Enemy abilites may not move the Protector or any adjacent allies.",
    category: "Passive",
  },
  Rodeuse: {
    name: "Rodeuse",
    description: "Moves to any space non-adjacent to an enemy.",
    category: "Active",
  },
  Tavernier: {
    name: "Tavernier",
    description: "Moves an adjacent ally one space.",
    category: "Active",
  },
  Vizir: {
    name: "Vizir",
    description:
      "Your Leader may move one additional space during their action.",
    category: "Passive",
  },
  king: {
    name: "Leader",
    description: "The royal leader. Protect at all costs!",
    category: "Leader",
  },
};
