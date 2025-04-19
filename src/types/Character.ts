export enum CharacterClass {
  MATHEMATICIAN = "mathematician",
  DECEIVER = "deceiver",
  DATA_MASTER = "data_master",
  SUPPORT = "support",
  BOX_MAKER = "box_maker",
  SOCIAL_TRAINER = "social_trainer",
  MAVERICK = "maverick",
  MEDIC = "medic",
  VERSATILE = "versatile",
  SPEEDSTER = "speedster",
  WARDEN = "warden"
}

export enum SkillType {
  COMBAT = "combat",
  TACTICS = "tactics",
  INTELLIGENCE = "intelligence",
  PERCEPTION = "perception",
  ENDURANCE = "endurance",
  CHARISMA = "charisma",
  STEALTH = "stealth",
  HACKING = "hacking",
  LEADERSHIP = "leadership",
  TEAMWORK = "teamwork"
}

export enum GameStrength {
  FIRST_PERSON_MOVEMENT = "first_person_movement",
  TACTICAL_AREA_CONTROL = "tactical_area_control",
  GRINDING = "grinding",
  SNIPING = "sniping",
  PAINFUL_GAMES = "painful_games",
  PERSISTENT_TRAINING = "persistent_training",
  HIGH_GAME_MODE = "high_game_mode",
  TEAM_SUPPORT = "team_support",
  JACK_OF_ALL_TRADES = "jack_of_all_trades",
  ADDICTION = "addiction",
  UNBREAKABLE_PATIENCE = "unbreakable_patience"
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  effect: (game: GameState) => void;
  unlockLevel: number;
  icon: string;
}

export interface CharacterSkill {
  type: SkillType;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  experience: number;
  experienceToNextLevel: number;
  trainingRate: number;
  
  bonuses: {
    strength?: number;
    agility?: number;
    intelligence?: number;
    charisma?: number;
    resourceGain?: number;
    missionSpeed?: number;
    abilityEffectiveness?: number;
  };
}

export interface Character {
  id: string;
  name: string;
  characterClass: CharacterClass;
  gameStrength: GameStrength;
  level: number;
  experience: number;
  abilities: Ability[];
  background: string;
  portrait: string;
  
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  
  skillPoints: number;
  upgradeTree: SkillNode[];
  
  skills: CharacterSkill[];
  currentlyTraining: SkillType | null;
  pausedTraining: SkillType | null;
  originalTraining: SkillType | null;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  requiredNodes: string[];
  effect: (character: Character) => void;
}

export interface GameState {
  characters: Character[];
  activeCharacters: Character[];
  resources: Resources;
  missions: Mission[];
  currentMissions: Mission[];
  unlockedCharacters: string[];
  gameTime: number;
  teamSynergy: number;
  autoMission: boolean;
  lastUpdateTime?: number;
}

export interface Resources {
  gold: number;
  dataPoints: number;
  teamMorale: number;
  adaptationTokens: number;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: number;
  rewards: Resources;
  requiredStrengths: GameStrength[];
  completionProgress: number;
  assignedCharacters: string[];
} 