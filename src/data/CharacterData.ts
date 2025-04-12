import { Character, CharacterClass, GameStrength, Ability, GameState, SkillNode, SkillType, CharacterSkill } from '../types/Character';

// Create empty upgrade trees for each character
// These will be populated later with proper skill trees
const emptyUpgradeTree: SkillNode[] = [];

// Define base abilities for Ryan
const ryanAbilities: Ability[] = [
  {
    id: "quick_calculations",
    name: "Quick Calculations",
    description: "Boosts movement speed and evasion by predicting enemy patterns.",
    cooldown: 30,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "calculator"
  },
  {
    id: "sleep_recharge",
    name: "Sleep Recharge",
    description: "Temporarily boosts energy regeneration during downtime.",
    cooldown: 120,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "bed"
  },
  {
    id: "early_bird",
    name: "Early Bird Advantage",
    description: "Gains bonus rewards for early mission completions.",
    cooldown: 300,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "sunrise"
  }
];

// Define base abilities for Daniel
const danielAbilities: Ability[] = [
  {
    id: "clever_misdirection",
    name: "Clever Misdirection",
    description: "Tricks opponents into misallocating resources or positioning.",
    cooldown: 45,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "mask"
  },
  {
    id: "zone_domination",
    name: "Zone Domination",
    description: "Controls an area, slowing enemy movements or weakening defenses.",
    cooldown: 90,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "area"
  },
  {
    id: "banter_boost",
    name: "Banter Boost",
    description: "Lowers enemy morale, reducing their attack efficiency.",
    cooldown: 60,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "chat"
  }
];

// Define base abilities for Josiah
const josiahAbilities: Ability[] = [
  {
    id: "algorithmic_insight",
    name: "Algorithmic Insight",
    description: "Optimizes resource generation rates.",
    cooldown: 60,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "algorithm"
  },
  {
    id: "data_dump",
    name: "Data Dump",
    description: "Reveals hidden enemy weaknesses or bonus loot locations.",
    cooldown: 120,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "database"
  },
  {
    id: "room_lock",
    name: "Room Lock",
    description: "Increases defense when isolated.",
    cooldown: 90,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "door"
  }
];

// Define base abilities for Case
const caseAbilities: Ability[] = [
  {
    id: "supportive_aim",
    name: "Supportive Aim",
    description: "A long-range attack that weakens enemies and boosts allies' accuracy.",
    cooldown: 45,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "target"
  },
  {
    id: "empathy_boost",
    name: "Empathy Boost",
    description: "Provides periodic health or morale regeneration for team members.",
    cooldown: 60,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "heart"
  },
  {
    id: "adaptable_tactics",
    name: "Adaptable Tactics",
    description: "Gains bonuses when coordinated with other characters, showing willingness to follow leadership.",
    cooldown: 90,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "arrows"
  }
];

// Define base abilities for Ian
const ianAbilities: Ability[] = [
  {
    id: "box_fortress",
    name: "Box Fortress",
    description: "Erects temporary cover that absorbs enemy fire, protecting the team.",
    cooldown: 50,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "shield"
  },
  {
    id: "tarkov_tolerance",
    name: "Tarkov Tolerance",
    description: "Gains damage mitigation when under heavy attack.",
    cooldown: 75,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "armor"
  },
  {
    id: "masochist_might",
    name: "Masochist's Might",
    description: "When taking damage, channels that pain into a temporary attack buff.",
    cooldown: 120,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "fist"
  }
];

// Define base abilities for Ben
const benAbilities: Ability[] = [
  {
    id: "motivational_hype",
    name: "Motivational Hype",
    description: "Enhances everyone's training speed or skill upgrade rates.",
    cooldown: 60,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "megaphone"
  },
  {
    id: "daily_log",
    name: "Daily Log",
    description: "Shares insights that provide in-game hints and static bonus multipliers.",
    cooldown: 240, // once per 4 minutes (representing daily)
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "book"
  },
  {
    id: "unity_pulse",
    name: "Unity Pulse",
    description: "Generates an aura that boosts experience gain for nearby team members.",
    cooldown: 180,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "pulse"
  }
];

// Define base abilities for Rodney
const rodneyAbilities: Ability[] = [
  {
    id: "motorcycle_mayhem",
    name: "Motorcycle Mayhem",
    description: "Gains a speed burst that allows the team to rush across a field and flank enemies.",
    cooldown: 90,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "motorcycle"
  },
  {
    id: "server_overclock",
    name: "Server Overclock",
    description: "Temporarily boosts team processing speeds for rapid decision-making.",
    cooldown: 120,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "server"
  },
  {
    id: "high_enlightenment",
    name: "High Enlightenment",
    description: "When in 'high' mode, becomes incredibly powerful and enhances nearby allies' damage.",
    cooldown: 300,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "cloud"
  }
];

// Define base abilities for Vinny
const vinnyAbilities: Ability[] = [
  {
    id: "rapid_heal",
    name: "Rapid Heal",
    description: "Instantly restores health to nearby allies.",
    cooldown: 45,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "medkit"
  },
  {
    id: "vitality_surge",
    name: "Vitality Surge",
    description: "Boosts recovery rates or shields allies from harm for a brief period.",
    cooldown: 75,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "pulse"
  },
  {
    id: "resilience_field",
    name: "Resilience Field",
    description: "Generates a protective aura that mitigates incoming damage.",
    cooldown: 120,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "shield-pulse"
  }
];

// Define base abilities for Kyle
const kyleAbilities: Ability[] = [
  {
    id: "clip_and_snip",
    name: "Clip and Snip",
    description: "A sniper attack that can also set tactical traps for enemies.",
    cooldown: 60,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "scissors"
  },
  {
    id: "adaptive_deployment",
    name: "Adaptive Deployment",
    description: "Can momentarily switch roles mid-mission depending on team needs.",
    cooldown: 90,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "arrows-switch"
  },
  {
    id: "design_ingenuity",
    name: "Design Ingenuity",
    description: "Can modify in-game elements to yield hidden bonuses or alter mission challenges.",
    cooldown: 180,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "pencil"
  }
];

// Define base abilities for Christian
const christianAbilities: Ability[] = [
  {
    id: "fearless_charge",
    name: "Fearless Charge",
    description: "Dashes at high speed with temporary invulnerability, breaking enemy lines.",
    cooldown: 45,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "lightning"
  },
  {
    id: "smokescreen_escape",
    name: "Smokescreen Escape",
    description: "Deploys a smoke bomb that obscures enemy vision and boosts critical hit chance.",
    cooldown: 75,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "smoke"
  },
  {
    id: "reckless_gambit",
    name: "Reckless Gambit",
    description: "Sacrifices health to unleash a devastating area-of-effect attack.",
    cooldown: 120,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "dice"
  }
];

// Define base abilities for Andrew
const andrewAbilities: Ability[] = [
  {
    id: "iron_focus",
    name: "Iron Focus",
    description: "Passive ability that increases idle resource generation the longer Andrew remains uninterrupted.",
    cooldown: 0, // Passive ability
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 1,
    icon: "focus"
  },
  {
    id: "lockdown_protocol",
    name: "Lockdown Protocol",
    description: "Freezes timers or enemy movements for a few seconds, giving team breathing room.",
    cooldown: 90,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 3,
    icon: "lock"
  },
  {
    id: "wardens_presence",
    name: "Warden's Presence",
    description: "Team-wide buff that reduces skill cooldowns and stabilizes random elements.",
    cooldown: 120,
    effect: (game: GameState) => {
      // Implementation will go here
    },
    unlockLevel: 5,
    icon: "shield"
  }
];

// Define character-specific skills
const getRyanSkills = (): CharacterSkill[] => [
  {
    type: SkillType.INTELLIGENCE,
    name: "Mathematical Analysis",
    description: "Ryan's natural talent for numbers helps analyze combat situations faster.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 1,
      missionSpeed: 0.05
    }
  },
  {
    type: SkillType.PERCEPTION,
    name: "Pattern Recognition",
    description: "Identify and predict enemy movements based on mathematical patterns.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.4,
    bonuses: {
      agility: 0.5,
      abilityEffectiveness: 0.05
    }
  },
  {
    type: SkillType.ENDURANCE,
    name: "Early Riser",
    description: "Proper sleep schedule leads to better stamina and energy conservation.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.3,
    bonuses: {
      strength: 0.3,
      resourceGain: 0.1
    }
  }
];

const getDanielSkills = (): CharacterSkill[] => [
  {
    type: SkillType.TACTICS,
    name: "Tactical Deception",
    description: "Daniel's wit allows for creative battlefield control through misdirection.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.5,
      abilityEffectiveness: 0.1
    }
  },
  {
    type: SkillType.CHARISMA,
    name: "Witty Banter",
    description: "Clever dialogue that distracts enemies and boosts team morale.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      charisma: 1,
      missionSpeed: 0.05
    }
  },
  {
    type: SkillType.STEALTH,
    name: "Subtle Manipulation",
    description: "Influence battlefield without revealing intentions or position.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.4,
    bonuses: {
      agility: 0.7,
      resourceGain: 0.05
    }
  }
];

const getJosiahSkills = (): CharacterSkill[] => [
  {
    type: SkillType.HACKING,
    name: "Data Mining",
    description: "Extract valuable information from any source with algorithmic precision.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      intelligence: 1,
      resourceGain: 0.15
    }
  },
  {
    type: SkillType.INTELLIGENCE,
    name: "Algorithm Optimization",
    description: "Improve efficiency of all operations through data-driven analysis.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.8,
      missionSpeed: 0.1
    }
  },
  {
    type: SkillType.ENDURANCE,
    name: "Room Isolation",
    description: "Extended focus during isolation periods for enhanced productivity.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.3,
    bonuses: {
      strength: 0.2,
      abilityEffectiveness: 0.08
    }
  }
];

const getCaseSkills = (): CharacterSkill[] => [
  {
    type: SkillType.PERCEPTION,
    name: "Precision Focus",
    description: "Case's natural talent for focusing on targets at extreme distances.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      agility: 0.8,
      abilityEffectiveness: 0.1
    }
  },
  {
    type: SkillType.CHARISMA,
    name: "Supportive Presence",
    description: "Case's gentle nature creates a calming environment that helps allies perform better.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      charisma: 1.2,
      missionSpeed: 0.05
    }
  },
  {
    type: SkillType.TEAMWORK,
    name: "Selfless Coordination",
    description: "Ability to seamlessly integrate with team tactics to maximize overall effectiveness.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.4,
    bonuses: {
      intelligence: 0.5,
      resourceGain: 0.08
    }
  }
];

const getIanSkills = (): CharacterSkill[] => [
  {
    type: SkillType.ENDURANCE,
    name: "Pain Tolerance",
    description: "Ian's ability to endure extreme discomfort and keep fighting.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.7,
    bonuses: {
      strength: 1.0,
      abilityEffectiveness: 0.05
    }
  },
  {
    type: SkillType.COMBAT,
    name: "Brutal Efficiency",
    description: "Experience with painful games translates to effectiveness in combat scenarios.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      strength: 0.8,
      agility: 0.4
    }
  },
  {
    type: SkillType.TACTICS,
    name: "Box Construction",
    description: "Efficient resource management and fortification building from box-making experience.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.4,
    bonuses: {
      intelligence: 0.5,
      resourceGain: 0.1
    }
  }
];

const getBenSkills = (): CharacterSkill[] => [
  {
    type: SkillType.LEADERSHIP,
    name: "Motivational Training",
    description: "Ben's ability to inspire others to push beyond their limits.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      charisma: 1.0,
      missionSpeed: 0.08
    }
  },
  {
    type: SkillType.ENDURANCE,
    name: "Persistent Work Ethic",
    description: "Dedication to continuous improvement through consistent training.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      strength: 0.7,
      abilityEffectiveness: 0.07
    }
  },
  {
    type: SkillType.TEAMWORK,
    name: "Social Cohesion",
    description: "Ability to keep the team connected and working as a unified whole.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.7,
    bonuses: {
      charisma: 0.8,
      resourceGain: 0.1
    }
  }
];

const getRodneySkills = (): CharacterSkill[] => [
  {
    type: SkillType.PERCEPTION,
    name: "Heightened Awareness",
    description: "Enhanced perception and reaction times when in 'high' state.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.9,
      abilityEffectiveness: 0.12
    }
  },
  {
    type: SkillType.TACTICS,
    name: "System Architecture",
    description: "Knowledge of server infrastructure applies to battlefield control.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.4,
    bonuses: {
      intelligence: 0.8,
      resourceGain: 0.1
    }
  },
  {
    type: SkillType.COMBAT,
    name: "Motorcycle Maneuvering",
    description: "Skills from motorcycle riding translate to agile combat movement.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      agility: 1.1,
      missionSpeed: 0.07
    }
  }
];

const getVinnySkills = (): CharacterSkill[] => [
  {
    type: SkillType.TEAMWORK,
    name: "Medical Triage",
    description: "Efficiently assess and prioritize healing targets based on need.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.7,
      missionSpeed: 0.1
    }
  },
  {
    type: SkillType.CHARISMA,
    name: "Bedside Manner",
    description: "Comforting presence that helps allies recover faster.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      charisma: 1.2,
      resourceGain: 0.05
    }
  },
  {
    type: SkillType.PERCEPTION,
    name: "Symptom Analysis",
    description: "Quickly identify weaknesses and vulnerabilities in targets.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.45,
    bonuses: {
      intelligence: 0.9,
      abilityEffectiveness: 0.08
    }
  }
];

const getKyleSkills = (): CharacterSkill[] => [
  {
    type: SkillType.PERCEPTION,
    name: "Designer's Eye",
    description: "Kyle's ability to see details and patterns that others miss.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.8,
      abilityEffectiveness: 0.1
    }
  },
  {
    type: SkillType.COMBAT,
    name: "Precision Strikes",
    description: "Carefully aimed attacks that target critical weak points.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.55,
    bonuses: {
      agility: 0.9,
      abilityEffectiveness: 0.08
    }
  },
  {
    type: SkillType.TACTICS,
    name: "Adaptive Strategy",
    description: "Flexibility to change approaches mid-mission based on circumstances.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.7,
      missionSpeed: 0.09
    }
  }
];

const getChristianSkills = (): CharacterSkill[] => [
  {
    type: SkillType.COMBAT,
    name: "Reckless Momentum",
    description: "Christian's fearless approach to danger translates to overwhelming offensive power.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.7,
    bonuses: {
      strength: 1.2,
      agility: 0.8
    }
  },
  {
    type: SkillType.ENDURANCE,
    name: "Nicotine Rush",
    description: "Short bursts of heightened performance followed by recovery periods.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      agility: 1.0,
      missionSpeed: 0.12
    }
  },
  {
    type: SkillType.PERCEPTION,
    name: "Risk Assessment",
    description: "Quickly calculate risk-reward scenarios for maximum advantage.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.6,
      abilityEffectiveness: 0.1
    }
  }
];

const getAndrewSkills = (): CharacterSkill[] => [
  {
    type: SkillType.ENDURANCE,
    name: "Unbreakable Patience",
    description: "Andrew can endure endless repetitive tasks without losing focus or efficiency.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.6,
    bonuses: {
      strength: 0.8,
      resourceGain: 0.15
    }
  },
  {
    type: SkillType.TACTICS,
    name: "Routine Mastery",
    description: "Gains efficiency bonuses when executing repetitive tasks, stacking small benefits over time.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.5,
    bonuses: {
      intelligence: 0.7,
      missionSpeed: 0.1
    }
  },
  {
    type: SkillType.LEADERSHIP,
    name: "Prison Protocol",
    description: "Strict discipline and order that keeps the team focused during chaos.",
    level: 1,
    maxLevel: 10,
    experience: 0,
    experienceToNextLevel: 100,
    trainingRate: 0.55,
    bonuses: {
      charisma: 0.6,
      abilityEffectiveness: 0.12
    }
  }
];

// Export the character data
export const characterData: Character[] = [
  {
    id: "ryan",
    name: "Ryan",
    characterClass: CharacterClass.MATHEMATICIAN,
    gameStrength: GameStrength.FIRST_PERSON_MOVEMENT,
    level: 1,
    experience: 0,
    abilities: ryanAbilities,
    background: "As an actuary and human calculator, Ryan is brilliant with numbers. His early bedtime is a source of both humor and his recharging ability.",
    portrait: "ryan.png",
    strength: 3,
    agility: 8,
    intelligence: 10,
    charisma: 6,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getRyanSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "daniel",
    name: "Daniel",
    characterClass: CharacterClass.DECEIVER,
    gameStrength: GameStrength.TACTICAL_AREA_CONTROL,
    level: 1,
    experience: 0,
    abilities: danielAbilities,
    background: "Daniel's wit and knack for deceit make him the master of subterfuge and tactical control.",
    portrait: "daniel.png",
    strength: 5,
    agility: 7,
    intelligence: 8,
    charisma: 9,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getDanielSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "josiah",
    name: "Josiah",
    characterClass: CharacterClass.DATA_MASTER,
    gameStrength: GameStrength.GRINDING,
    level: 1,
    experience: 0,
    abilities: josiahAbilities,
    background: "Josiah is a reclusive genius whose data-driven mind makes him an expert at mining vital information.",
    portrait: "josiah.png",
    strength: 4,
    agility: 5,
    intelligence: 10,
    charisma: 3,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getJosiahSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "case",
    name: "Case",
    characterClass: CharacterClass.SUPPORT,
    gameStrength: GameStrength.SNIPING,
    level: 1,
    experience: 0,
    abilities: caseAbilities,
    background: "Known for kindness and a supportive nature, Case provides the backbone of team morale with surprising precision in long-range support.",
    portrait: "case.png",
    strength: 5,
    agility: 9,
    intelligence: 7,
    charisma: 8,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getCaseSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "ian",
    name: "Ian",
    characterClass: CharacterClass.BOX_MAKER,
    gameStrength: GameStrength.PAINFUL_GAMES,
    level: 1,
    experience: 0,
    abilities: ianAbilities,
    background: "From constructing boxes to relishing challenging game scenarios, Ian embodies rugged resilience and the ability to endure pain for gain.",
    portrait: "ian.png",
    strength: 9,
    agility: 6,
    intelligence: 7,
    charisma: 5,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getIanSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "ben",
    name: "Ben",
    characterClass: CharacterClass.SOCIAL_TRAINER,
    gameStrength: GameStrength.PERSISTENT_TRAINING,
    level: 1,
    experience: 0,
    abilities: benAbilities,
    background: "Ben thrives on sharing experiences and insists on staying involved. His passion for training reflects a persistent work ethic.",
    portrait: "ben.png",
    strength: 7,
    agility: 6,
    intelligence: 7,
    charisma: 9,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getBenSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "rodney",
    name: "Rodney",
    characterClass: CharacterClass.MAVERICK,
    gameStrength: GameStrength.HIGH_GAME_MODE,
    level: 1,
    experience: 0,
    abilities: rodneyAbilities,
    background: "With diverse hobbies, mastery over motorcycles and servers, Rodney is unpredictable in both personality and skill.",
    portrait: "rodney.png",
    strength: 6,
    agility: 8,
    intelligence: 9,
    charisma: 7,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getRodneySkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "vinny",
    name: "Vinny",
    characterClass: CharacterClass.MEDIC,
    gameStrength: GameStrength.TEAM_SUPPORT,
    level: 1,
    experience: 0,
    abilities: vinnyAbilities,
    background: "With a strong background in medicine and a nurturing approach, Vinny is the go-to healer and support specialist.",
    portrait: "vinny.png",
    strength: 4,
    agility: 6,
    intelligence: 9,
    charisma: 8,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getVinnySkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "kyle",
    name: "Kyle",
    characterClass: CharacterClass.VERSATILE,
    gameStrength: GameStrength.JACK_OF_ALL_TRADES,
    level: 1,
    experience: 0,
    abilities: kyleAbilities,
    background: "With his distinct bald look and mastery over 3D design, Kyle brings all-round versatility and adaptive tactics.",
    portrait: "kyle.png",
    strength: 6,
    agility: 7,
    intelligence: 8,
    charisma: 6,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getKyleSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "christian",
    name: "Christian",
    characterClass: CharacterClass.SPEEDSTER,
    gameStrength: GameStrength.ADDICTION,
    level: 1,
    experience: 0,
    abilities: christianAbilities,
    background: "Christian is the embodiment of fearlessness—a daredevil who never hesitates to push limits. His addiction to smoking and speed gives him unique abilities and vulnerabilities.",
    portrait: "christian.png",
    strength: 7,
    agility: 10,
    intelligence: 6,
    charisma: 6,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getChristianSkills(),
    currentlyTraining: null,
    pausedTraining: null
  },
  {
    id: "andrew",
    name: "Andrew",
    characterClass: CharacterClass.WARDEN,
    gameStrength: GameStrength.UNBREAKABLE_PATIENCE,
    level: 1,
    experience: 0,
    abilities: andrewAbilities,
    background: "Andrew is a stoic sentinel—calm, quiet, and always watching. As a prison guard by trade, he's developed a kind of unshakable patience that makes him ideal for long-haul challenges. He doesn't flinch, doesn't fidget, and never loses focus, even when everything is falling apart around him.",
    portrait: "andrew.png",
    strength: 7,
    agility: 4,
    intelligence: 6,
    charisma: 5,
    skillPoints: 0,
    upgradeTree: emptyUpgradeTree,
    skills: getAndrewSkills(),
    currentlyTraining: null,
    pausedTraining: null
  }
]; 