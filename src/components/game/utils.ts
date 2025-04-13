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

// Character class display names for UI
export const formatClassName = (characterClass: string): string => {
  // Convert values like "data_master" to "Data Master"
  return characterClass
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format game strength name
export const formatGameStrength = (gameStrength: string): string => {
  return gameStrength
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Check if a saved game exists
export const checkForSavedGame = (): boolean => {
  try {
    const savedGameData = localStorage.getItem('idle_heroes_game_state');
    if (!savedGameData) return false;
    
    // Try to parse it to make sure it's valid JSON
    const parsedData = JSON.parse(savedGameData);
    
    // Verify it has at least some expected properties of a GameState
    return !!parsedData && 
           !!parsedData.characters && 
           !!parsedData.activeCharacters &&
           parsedData.activeCharacters.length > 0;
  } catch (e) {
    // If there's any error parsing, consider there's no valid saved game
    console.error("Error checking for saved game:", e);
    return false;
  }
};

// Helper function to get color based on character class for placeholders
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

// Helper function to calculate total resource generation rate
export const calculateTotalResourceRate = (gameState: GameState): number => {
  // Calculate gold generation per minute
  return gameState.activeCharacters.reduce((total, character) => {
    // Get resource gain bonus from skills
    const resourceBonus = character.skills.reduce((bonus, skill) => {
      return bonus + (skill.bonuses.resourceGain || 0) * skill.level;
    }, 0);
    
    // Basic formula: character level * 0.5 * (1 + bonus) * 60 (to convert to per minute)
    return total + (character.level * 0.5) * (1 + resourceBonus) * 60;
  }, 0);
}; 