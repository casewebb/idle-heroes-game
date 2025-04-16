import { GameState, SkillType } from '../../types/Character';

// Calculate XP required for next level
export const calculateXpForNextLevel = (currentLevel: number): number => {
  return Math.round(100 * Math.pow(1.5, currentLevel));
};

// Skill type display names for UI
export const skillTypeNames: Record<SkillType, string> = {
  [SkillType.COMBAT]: "Combat",
  [SkillType.TACTICS]: "Tactics",
  [SkillType.INTELLIGENCE]: "Intelligence",
  [SkillType.PERCEPTION]: "Perception",
  [SkillType.ENDURANCE]: "Endurance",
  [SkillType.CHARISMA]: "Charisma",
  [SkillType.STEALTH]: "Stealth",
  [SkillType.HACKING]: "Hacking",
  [SkillType.LEADERSHIP]: "Leadership",
  [SkillType.TEAMWORK]: "Teamwork"
};

export const formatClassName = (characterClass: string): string => {
  return characterClass
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatGameStrength = (gameStrength: string): string => {
  return gameStrength
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const checkForSavedGame = (): boolean => {
  try {
    const savedGameData = localStorage.getItem('idle_heroes_game_state');
    if (!savedGameData) return false;
    
    const parsedData = JSON.parse(savedGameData);
    
    return !!parsedData && 
           !!parsedData.characters && 
           !!parsedData.activeCharacters &&
           parsedData.activeCharacters.length > 0;
  } catch (e) {
    console.error("Error checking for saved game:", e);
    return false;
  }
};

export const getColorForCharacter = (characterClass: string): string => {
  const colors: Record<string, string> = {
    mathematician: "#4287f5", // blue
    deceiver: "#9c42f5",      // purple
    data_master: "#42f5f2",   // cyan
    support: "#42f582",       // green
    box_maker: "#f5d742",     // yellow
    social_trainer: "#f59642", // orange
    maverick: "#f54242",      // red
    medic: "#f0f0f0",         // white
    versatile: "#a1a1a1",     // gray
    speedster: "#ff9900"      // bright orange
  };
  
  return colors[characterClass.toLowerCase()] || "#cccccc";
};

export const calculateTotalResourceRate = (gameState: GameState): number => {
  return gameState.activeCharacters.reduce((total, character) => {
    const resourceBonus = character.skills.reduce((bonus, skill) => {
      return bonus + (skill.bonuses.resourceGain || 0) * skill.level;
    }, 0);
    
    // Basic formula: character level * 0.5 * (1 + bonus) * 60 (to convert to per minute)
    return total + (character.level * 0.5) * (1 + resourceBonus) * 60;
  }, 0);
}; 