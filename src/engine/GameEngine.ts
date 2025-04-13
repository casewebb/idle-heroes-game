import { GameState, Character, Mission, Resources, SkillType, CharacterSkill, GameStrength } from '../types/Character';
import { characterData } from '../data/CharacterData';

// Local Storage Key
const GAME_STATE_KEY = 'idle_heroes_game_state';
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

export class GameEngine {
  private gameState: GameState;
  private lastTimestamp: number;
  private idleMultiplier: number = 1.0;
  private autoSaveTimer: number | null = null;
  private lastSaveTime: number = 0;
  private lastUnlockedCharacter: Character | null = null;
  
  constructor(startingCharacterId?: string) {
    console.log("GameEngine constructor called with:", startingCharacterId);
    
    // If a specific starting character ID is provided, always create a new game
    if (startingCharacterId) {
      console.log("Creating new game with specified character:", startingCharacterId);
      this.gameState = this.initializeGameState(startingCharacterId);
      console.log("Created new game with character:", 
        this.gameState.activeCharacters[0].name, 
        this.gameState.activeCharacters[0].id);
    } else {
      // Only try to load saved game if no specific character was requested
      const savedState = this.loadGameState();
      
      if (savedState) {
        this.gameState = savedState;
        console.log('Loaded saved game state');
      } else {
        // Initialize new game state with default character if nothing saved
        this.gameState = this.initializeGameState();
        console.log('Started new game with default character');
      }
    }
    
    this.lastTimestamp = Date.now();
    this.lastSaveTime = Date.now();
    
    // Set up auto-save interval
    this.setupAutoSave();
  }
  
  // Set up auto-save timer
  private setupAutoSave(): void {
    // Clear any existing timer
    if (this.autoSaveTimer) {
      window.clearInterval(this.autoSaveTimer);
    }
    
    // Set up new timer for auto-saving every 5 minutes
    this.autoSaveTimer = window.setInterval(() => {
      this.saveGameState();
      this.lastSaveTime = Date.now();
      console.log('Auto-saved game state');
    }, AUTO_SAVE_INTERVAL);
    
    // Also set up event listeners to save the game when the page is closed or hidden
    window.addEventListener('beforeunload', () => {
      this.saveGameState();
    });
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveGameState();
      }
    });
  }
  
  // Clean up resources when the game engine is no longer needed
  public cleanup(): void {
    if (this.autoSaveTimer) {
      window.clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    // Force a final save
    this.saveGameState();
  }
  
  private initializeGameState(startingCharacterId?: string): GameState {
    console.log("initializeGameState called with:", startingCharacterId);
    
    // If a specific character ID is provided, use that character
    // Otherwise, pick a random character from the available options
    let startingCharacter;
    
    if (startingCharacterId) {
      // Try to find the requested character, fall back to random if not found
      startingCharacter = characterData.find(char => char.id === startingCharacterId);
      if (!startingCharacter) {
        console.log("Requested character not found, picking a random one instead");
        const randomIndex = Math.floor(Math.random() * characterData.length);
        startingCharacter = characterData[randomIndex];
      }
    } else {
      // No character specified, choose a random one
      const randomIndex = Math.floor(Math.random() * characterData.length);
      startingCharacter = characterData[randomIndex];
    }
    
    console.log("Selected starting character:", startingCharacter.name, startingCharacter.id);
    
    return {
      characters: characterData,
      activeCharacters: [startingCharacter],
      resources: {
        gold: 0,
        dataPoints: 0,
        teamMorale: 50,
        adaptationTokens: 0
      },
      missions: [],
      currentMissions: [],
      unlockedCharacters: [startingCharacter.id],
      gameTime: 0,
      teamSynergy: 0
    };
  }
  
  public update(): void {
    const currentTime = Date.now();
    let deltaTime = (currentTime - this.lastTimestamp) / 1000; // seconds
    this.lastTimestamp = currentTime;
    
    // Ensure deltaTime is positive and within reasonable bounds
    if (deltaTime < 0) {
      console.warn(`Negative deltaTime detected: ${deltaTime}. Setting to 0.1`);
      deltaTime = 0.1; // Use a small positive value instead
    } else if (deltaTime > 60) {
      // Cap very large time deltas (e.g., after computer sleep)
      console.warn(`Very large deltaTime detected: ${deltaTime}. Capping at 60 seconds.`);
      deltaTime = 60;
    }
    
    this.gameState.gameTime += deltaTime;
    
    // Ensure currentMissions is always defined to avoid errors
    if (!this.gameState.currentMissions) {
      this.gameState.currentMissions = [];
    }
    
    // Update idle progression
    this.processIdleGains(deltaTime);
    
    // Process active missions if there are any
    if (this.gameState.currentMissions.length > 0) {
      this.processMission(deltaTime);
    }
    
    // Process skill training for characters
    this.processSkillTraining(deltaTime);
    
    // Recalculate team synergy
    this.calculateTeamSynergy();
    
    // Save game state after updates, but not too frequently to avoid performance issues
    // We'll rely on the auto-save for periodic saving and save immediately after
    // important actions instead
  }
  
  // Save game state to localStorage
  public saveGameState(): void {
    try {
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(this.gameState));
      this.lastSaveTime = Date.now();
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }
  
  // Get time since last save in seconds
  public getTimeSinceLastSave(): number {
    return (Date.now() - this.lastSaveTime) / 1000;
  }
  
  // Load game state from localStorage
  private loadGameState(): GameState | null {
    try {
      const savedStateString = localStorage.getItem(GAME_STATE_KEY);
      if (!savedStateString) {
        console.log("No saved game state found in localStorage");
        return null;
      }
      
      console.log("Found saved game state in localStorage");
      const savedState = JSON.parse(savedStateString) as GameState;
      
      // Add debugging to see active character
      if (savedState.activeCharacters && savedState.activeCharacters.length > 0) {
        console.log("Loaded game has active character:", 
          savedState.activeCharacters[0].name, 
          savedState.activeCharacters[0].id);
      }
      
      // Restore function references which don't survive JSON serialization
      this.restoreFunctionReferences(savedState);
      
      return savedState;
    } catch (error) {
      console.error('Error loading game state:', error);
      return null;
    }
  }
  
  // Restore function references lost in serialization
  private restoreFunctionReferences(state: GameState): void {
    // Restore abilities effect functions
    state.characters.forEach(character => {
      const originalChar = characterData.find(c => c.id === character.id);
      if (originalChar) {
        // Restore ability effect functions
        character.abilities.forEach((ability, index) => {
          if (originalChar.abilities[index]) {
            ability.effect = originalChar.abilities[index].effect;
          }
        });
        
        // Restore upgrade tree effect functions
        character.upgradeTree.forEach((upgrade, index) => {
          if (originalChar.upgradeTree[index]) {
            upgrade.effect = originalChar.upgradeTree[index].effect;
          }
        });
        
        // Fix any skill references and ensure currentlyTraining is valid
        if (character.currentlyTraining) {
          // Verify the training skill exists on the character
          const hasSkill = character.skills.some(s => s.type === character.currentlyTraining);
          if (!hasSkill) {
            // If the skill doesn't exist, set currentlyTraining to null
            character.currentlyTraining = null;
          }
        }
        
        // Ensure skill experience is within valid bounds and training rates are valid
        character.skills.forEach((skill, index) => {
          if (skill.experience < 0) skill.experience = 0;
          if (skill.experience > skill.experienceToNextLevel) {
            skill.experience = skill.experienceToNextLevel - 1;
          }
          
          // Make sure skill level doesn't exceed max level
          if (skill.level > skill.maxLevel) {
            skill.level = skill.maxLevel;
          }
          
          // Ensure training rate is non-zero by using the original if needed
          if (!skill.trainingRate || skill.trainingRate <= 0) {
            console.warn(`Fixing zero/negative training rate for ${character.name}'s ${skill.name} skill`);
            if (originalChar.skills[index] && originalChar.skills[index].trainingRate > 0) {
              skill.trainingRate = originalChar.skills[index].trainingRate;
            } else {
              // Set a default training rate if original is also zero
              skill.trainingRate = 0.5;
            }
          }
        });
      }
    });
    
    // Fix any references to active characters
    const validCharacterIds = state.characters.map(c => c.id);
    
    // Ensure active characters reference valid characters
    state.activeCharacters = state.activeCharacters.filter(character => 
      validCharacterIds.includes(character.id)
    );
    
    // Ensure unlocked characters are valid
    state.unlockedCharacters = state.unlockedCharacters.filter(id => 
      validCharacterIds.includes(id)
    );
    
    // If we have no active characters but have unlocked ones, add the first unlocked character
    if (state.activeCharacters.length === 0 && state.unlockedCharacters.length > 0) {
      const firstUnlockedId = state.unlockedCharacters[0];
      const character = state.characters.find(c => c.id === firstUnlockedId);
      if (character) {
        state.activeCharacters.push(character);
      }
    }
    
    // Handle migration from old format (currentMission) to new format (currentMissions array)
    if (!state.currentMissions) {
      console.log('Migrating from old save format (currentMission) to new format (currentMissions array)');
      state.currentMissions = [];
      
      // @ts-ignore - Access the old property to migrate the data
      if (state.currentMission) {
        // @ts-ignore - Access the old property to migrate the data
        state.currentMissions.push(state.currentMission);
        console.log('Migrated current mission to currentMissions array');
      }
      
      // @ts-ignore - Delete the old property
      delete state.currentMission;
    }
    
    // Run a debug check of skill training settings
    this.debugSkillTraining(state);
  }
  
  // Debug method to check skill training configuration
  private debugSkillTraining(state: GameState): void {
    console.log("======= DEBUG: SKILL TRAINING CONFIGURATION =======");
    state.activeCharacters.forEach(character => {
      console.log(`Character: ${character.name} (${character.id})`);
      console.log(`Currently training: ${character.currentlyTraining || 'None'}`);
      
      if (character.currentlyTraining) {
        const skill = character.skills.find(s => s.type === character.currentlyTraining);
        if (skill) {
          console.log(`Training skill: ${skill.name}`);
          console.log(`- Level: ${skill.level}/${skill.maxLevel}`);
          console.log(`- Experience: ${skill.experience}/${skill.experienceToNextLevel}`);
          console.log(`- Training rate: ${skill.trainingRate}`);
        } else {
          console.error(`!!! ERROR: Character is training a skill ${character.currentlyTraining} that doesn't exist!`);
        }
      }
      
      // Check for any skills with zero or negative training rates
      const invalidSkills = character.skills.filter(s => !s.trainingRate || s.trainingRate <= 0);
      if (invalidSkills.length > 0) {
        console.warn(`!!! WARNING: Character has ${invalidSkills.length} skills with invalid training rates:`);
        invalidSkills.forEach(s => {
          console.warn(`- ${s.name}: ${s.trainingRate}`);
        });
      }
    });
    console.log("====================================================");
  }
  
  // Reset game state (for debugging or user requested reset)
  public resetGame(startingCharacterId?: string): void {
    console.log("Resetting game with character ID:", startingCharacterId);
    
    // Clear localStorage to ensure no saved game is loaded
    localStorage.removeItem(GAME_STATE_KEY);
    
    this.gameState = this.initializeGameState(startingCharacterId);
    this.saveGameState();
    console.log('Game state reset and saved');
  }
  
  private processIdleGains(deltaTime: number): void {
    // Calculate idle gains based on unlocked characters and their levels
    const goldGain = this.calculateIdleGoldGain() * deltaTime * this.idleMultiplier;
    const dataPointsGain = this.calculateIdleDataPointsGain() * deltaTime * this.idleMultiplier;
    
    // Apply gains
    this.gameState.resources.gold += goldGain;
    this.gameState.resources.dataPoints += dataPointsGain;
  }
  
  private calculateIdleGoldGain(): number {
    // Sum up gold generation from all unlocked characters
    return this.gameState.activeCharacters.reduce((total, character) => {
      // Get resource gain bonus from skills
      const resourceBonus = this.getCharacterResourceBonus(character);
      return total + (character.level * 0.5) * (1 + resourceBonus);
    }, 0);
  }
  
  private calculateIdleDataPointsGain(): number {
    // Special focus on Josiah's data mastery if unlocked
    const dataMultiplier = this.gameState.unlockedCharacters.includes("josiah") ? 1.5 : 1.0;
    
    return this.gameState.activeCharacters.reduce((total, character) => {
      // Get resource gain bonus from skills
      const resourceBonus = this.getCharacterResourceBonus(character);
      return total + ((character.intelligence * 0.2) * dataMultiplier) * (1 + resourceBonus);
    }, 0);
  }
  
  private processMission(deltaTime: number): void {
    // Ensure currentMissions is defined to avoid errors
    if (!this.gameState.currentMissions) {
      this.gameState.currentMissions = [];
      return;
    }
    
    if (this.gameState.currentMissions.length === 0) return;
    
    // Array to track missions that need to be completed
    const completedMissionIndices: number[] = [];
    
    // Process each mission in the array
    this.gameState.currentMissions.forEach((mission, index) => {
      // Progress the mission based on assigned characters and time
      const progressRate = this.calculateMissionProgressRate(mission);
      
      mission.completionProgress += progressRate * deltaTime;
      
      // Check if mission is complete
      if (mission.completionProgress >= 100) {
        completedMissionIndices.push(index);
      }
    });
    
    // Complete missions in reverse order to avoid index shifting issues
    for (let i = completedMissionIndices.length - 1; i >= 0; i--) {
      const missionIndex = completedMissionIndices[i];
      this.completeMission(missionIndex);
    }
  }
  
  private calculateMissionProgressRate(mission: Mission): number {
    if (!mission) return 0;
    
    let baseRate = 1.0;
    
    // Check if we have characters with the required strengths
    const strengthCoverage = mission.requiredStrengths.filter(strength => 
      mission.assignedCharacters.some(charId => {
        const char = this.gameState.characters.find(c => c.id === charId);
        return char && char.gameStrength === strength;
      })
    ).length / mission.requiredStrengths.length;
    
    // Apply synergy bonus using assigned characters
    // Calculate a mini-synergy just for the assigned team
    let missionTeamSynergy = 0;
    const assignedChars = mission.assignedCharacters.map(id => 
      this.gameState.characters.find(c => c.id === id)
    ).filter(Boolean) as Character[];
    
    // Different character classes provide better synergy
    const uniqueClasses = new Set(assignedChars.map(char => char.characterClass));
    missionTeamSynergy += uniqueClasses.size * 5;
    
    // Apply the mission team synergy
    baseRate *= (1 + (missionTeamSynergy / 100));
    
    // Apply strength coverage
    baseRate *= (0.5 + (strengthCoverage * 0.5));
    
    // Apply difficulty modifier
    baseRate /= mission.difficulty;
    
    // Apply mission speed bonuses from skills of assigned characters
    const missionSpeedBonus = this.calculateTeamMissionSpeedBonus(mission.assignedCharacters);
    baseRate *= (1 + missionSpeedBonus);
    
    return baseRate;
  }
  
  private calculateTeamMissionSpeedBonus(characterIds: string[]): number {
    return characterIds.reduce((bonus, charId) => {
      const character = this.gameState.characters.find(c => c.id === charId);
      if (!character) return bonus;
      
      return bonus + character.skills.reduce((charBonus, skill) => {
        return charBonus + (skill.bonuses.missionSpeed || 0) * skill.level;
      }, 0);
    }, 0);
  }
  
  private completeMission(index: number): void {
    // Ensure currentMissions is defined to avoid errors
    if (!this.gameState.currentMissions) {
      this.gameState.currentMissions = [];
      return;
    }
    
    if (this.gameState.currentMissions.length === 0) return;
    
    // Award mission rewards
    const rewards = this.gameState.currentMissions[index].rewards;
    this.gameState.resources.gold += rewards.gold;
    this.gameState.resources.dataPoints += rewards.dataPoints;
    this.gameState.resources.teamMorale += rewards.teamMorale;
    this.gameState.resources.adaptationTokens += rewards.adaptationTokens;
    
    // Award XP to characters assigned to the mission
    for (const characterId of this.gameState.currentMissions[index].assignedCharacters) {
      const xpGain = 10 * this.gameState.currentMissions[index].difficulty;
      this.awardExperience(characterId, xpGain);
    }
    
    // Chance to unlock a new character based on mission difficulty
    const missionDifficulty = this.gameState.currentMissions[index].difficulty;
    const unlockChance = missionDifficulty * 0.1; // 10% chance per difficulty point
    
    if (Math.random() < unlockChance) {
      this.tryUnlockRandomCharacter();
    }
    
    // Get the assigned characters before clearing the mission
    const assignedCharacters = [...this.gameState.currentMissions[index].assignedCharacters];
    
    // Generate new mission to replace completed one
    this.generateNewMission();
    
    // Clear current mission and allow characters to resume training
    this.gameState.currentMissions.splice(index, 1);
    
    // Resume training for characters that were on the mission
    this.resumeTrainingForCharacters(assignedCharacters);
    
    // Save the game after mission completion
    this.saveGameState();
  }
  
  // Get the last unlocked character (used by UI to display popup)
  public getLastUnlockedCharacter(): Character | null {
    return this.lastUnlockedCharacter;
  }
  
  // Clear the last unlocked character after UI has displayed it
  public clearLastUnlockedCharacter(): void {
    this.lastUnlockedCharacter = null;
  }
  
  // Try to unlock a random character that isn't already unlocked
  private tryUnlockRandomCharacter(): void {
    const unlockedSet = new Set(this.gameState.unlockedCharacters);
    const lockedCharacters = this.gameState.characters
      .filter(char => !unlockedSet.has(char.id));
    
    if (lockedCharacters.length > 0) {
      // Pick a random character to unlock
      const randomIndex = Math.floor(Math.random() * lockedCharacters.length);
      const characterToUnlock = lockedCharacters[randomIndex];
      
      // Unlock the character
      this.unlockCharacter(characterToUnlock.id);
      
      // Store the unlocked character for UI to display
      this.lastUnlockedCharacter = characterToUnlock;
      
      console.log(`Unlocked new character: ${characterToUnlock.name}!`);
    }
  }
  
  // Generate a new mission to replace a completed one
  private generateNewMission(): void {
    // Base the difficulty on the current game progression
    const baselineDifficulty = 1 + (this.gameState.unlockedCharacters.length * 0.2);
    
    // Create a pool of possible mission types with expanded options
    const missionTypes = [
      {
        name: "Resource Gathering",
        description: "Collect vital resources for the team.",
        difficultyMod: 0.8,
        rewards: { gold: 200, dataPoints: 100, teamMorale: 3, adaptationTokens: 1 },
        possibleStrengths: [
          GameStrength.GRINDING, 
          GameStrength.PERSISTENT_TRAINING,
          GameStrength.JACK_OF_ALL_TRADES,
          GameStrength.ADDICTION,
          GameStrength.UNBREAKABLE_PATIENCE
        ]
      },
      {
        name: "Tactical Operation",
        description: "Execute a precise maneuver requiring coordination.",
        difficultyMod: 1.2,
        rewards: { gold: 150, dataPoints: 150, teamMorale: 5, adaptationTokens: 2 },
        possibleStrengths: [
          GameStrength.TACTICAL_AREA_CONTROL, 
          GameStrength.TEAM_SUPPORT, 
          GameStrength.JACK_OF_ALL_TRADES,
          GameStrength.HIGH_GAME_MODE
        ]
      },
      {
        name: "Speed Run",
        description: "Complete an objective as quickly as possible.",
        difficultyMod: 1.0,
        rewards: { gold: 120, dataPoints: 120, teamMorale: 8, adaptationTokens: 2 },
        possibleStrengths: [
          GameStrength.ADDICTION, 
          GameStrength.FIRST_PERSON_MOVEMENT, 
          GameStrength.SNIPING,
          GameStrength.HIGH_GAME_MODE
        ]
      },
      {
        name: "Endurance Test",
        description: "A challenging test that pushes the team's limits.",
        difficultyMod: 1.5,
        rewards: { gold: 300, dataPoints: 300, teamMorale: 10, adaptationTokens: 3 },
        possibleStrengths: [
          GameStrength.PAINFUL_GAMES, 
          GameStrength.PERSISTENT_TRAINING, 
          GameStrength.GRINDING,
          GameStrength.TEAM_SUPPORT,
          GameStrength.UNBREAKABLE_PATIENCE
        ]
      },
      {
        name: "Covert Infiltration",
        description: "Sneak into a secured location to retrieve valuable information.",
        difficultyMod: 1.3,
        rewards: { gold: 250, dataPoints: 200, teamMorale: 7, adaptationTokens: 2 },
        possibleStrengths: [
          GameStrength.SNIPING, 
          GameStrength.FIRST_PERSON_MOVEMENT, 
          GameStrength.JACK_OF_ALL_TRADES,
          GameStrength.TACTICAL_AREA_CONTROL,
          GameStrength.UNBREAKABLE_PATIENCE
        ]
      },
      {
        name: "Digital Heist",
        description: "Break through digital security systems to access restricted data.",
        difficultyMod: 1.4,
        rewards: { gold: 150, dataPoints: 350, teamMorale: 6, adaptationTokens: 2 },
        possibleStrengths: [
          GameStrength.HIGH_GAME_MODE, 
          GameStrength.JACK_OF_ALL_TRADES, 
          GameStrength.TACTICAL_AREA_CONTROL,
          GameStrength.PERSISTENT_TRAINING
        ]
      },
      {
        name: "Diplomatic Negotiation",
        description: "Negotiate favorable terms with rival factions.",
        difficultyMod: 0.9,
        rewards: { gold: 300, dataPoints: 150, teamMorale: 12, adaptationTokens: 1 },
        possibleStrengths: [
          GameStrength.TEAM_SUPPORT, 
          GameStrength.JACK_OF_ALL_TRADES,
          GameStrength.HIGH_GAME_MODE,
          GameStrength.GRINDING
        ]
      },
      {
        name: "Combat Arena",
        description: "Prove your team's combat prowess in a battle arena.",
        difficultyMod: 1.6,
        rewards: { gold: 400, dataPoints: 100, teamMorale: 8, adaptationTokens: 3 },
        possibleStrengths: [
          GameStrength.PAINFUL_GAMES, 
          GameStrength.SNIPING, 
          GameStrength.FIRST_PERSON_MOVEMENT,
          GameStrength.ADDICTION
        ]
      },
      {
        name: "Long Surveillance",
        description: "Monitor a target location for extended periods to gather intelligence.",
        difficultyMod: 1.2,
        rewards: { gold: 250, dataPoints: 250, teamMorale: 5, adaptationTokens: 2 },
        possibleStrengths: [
          GameStrength.UNBREAKABLE_PATIENCE,
          GameStrength.SNIPING,
          GameStrength.PERSISTENT_TRAINING
        ]
      }
    ];
    
    // Choose a random mission type
    const randomIndex = Math.floor(Math.random() * missionTypes.length);
    const missionType = missionTypes[randomIndex];
    
    // Calculate actual difficulty
    const difficulty = baselineDifficulty * missionType.difficultyMod;
    
    // Scale rewards based on difficulty
    const scaledRewards = {
      gold: Math.floor(missionType.rewards.gold * difficulty),
      dataPoints: Math.floor(missionType.rewards.dataPoints * difficulty),
      teamMorale: Math.floor(missionType.rewards.teamMorale),
      adaptationTokens: missionType.rewards.adaptationTokens
    };
    
    // Randomly select 2 required strengths from the possible strengths
    const strengths = [...missionType.possibleStrengths];
    const requiredStrengths: GameStrength[] = [];
    
    // Select 2 random strengths (or all if there are less than 2)
    const numRequired = Math.min(2, strengths.length);
    for (let i = 0; i < numRequired; i++) {
      const randomStrengthIndex = Math.floor(Math.random() * strengths.length);
      requiredStrengths.push(strengths[randomStrengthIndex]);
      // Remove the selected strength to avoid duplicates
      strengths.splice(randomStrengthIndex, 1);
    }
    
    // Create the new mission
    const newMission: Mission = {
      id: `mission_${Date.now()}`,
      name: missionType.name,
      description: missionType.description,
      duration: 60 * difficulty, // Duration scales with difficulty
      difficulty: difficulty,
      rewards: scaledRewards,
      requiredStrengths: requiredStrengths,
      completionProgress: 0,
      assignedCharacters: [] // New field to track assigned characters
    };
    
    // Add the mission to the game state
    this.gameState.missions.push(newMission);
  }
  
  private calculateTeamSynergy(): void {
    const activeCharacters = this.gameState.activeCharacters;
    
    // Basic synergy calculation based on character combination
    let synergy = 0;
    
    // Different character classes provide better synergy
    const uniqueClasses = new Set(activeCharacters.map(char => char.characterClass));
    synergy += uniqueClasses.size * 5;
    
    // Some specific character combinations have special synergy
    if (this.hasCharacterCombo(["daniel", "kyle"])) {
      synergy += 10; // Daniel and Kyle have great synergy
    }
    
    if (this.hasCharacterCombo(["vinny", "ben"])) {
      synergy += 10; // Vinny and Ben boost team morale
    }
    
    this.gameState.teamSynergy = synergy;
  }
  
  private hasCharacterCombo(characterIds: string[]): boolean {
    return characterIds.every(id => 
      this.gameState.activeCharacters.some(char => char.id === id)
    );
  }
  
  public awardExperience(characterId: string, amount: number): void {
    // Ensure amount is positive
    if (amount <= 0) {
      console.warn(`Attempted to award non-positive experience (${amount}) to character ${characterId}`);
      return;
    }
    
    // Find the character in both arrays
    const character = this.gameState.characters.find(c => c.id === characterId);
    const activeCharacter = this.gameState.activeCharacters.find(c => c.id === characterId);
    
    if (!character) {
      console.error(`Character ${characterId} not found in characters array`);
      return;
    }
    
    // Add experience to the character
    character.experience += amount;
    console.log(`Awarded ${amount} XP to ${character.name} (${characterId})`);
    
    // If character is also in active characters, update that reference too
    if (activeCharacter) {
      activeCharacter.experience = character.experience;
    }
    
    // Check for level up
    const xpNeeded = this.calculateXpForNextLevel(character.level);
    if (character.experience >= xpNeeded) {
      character.experience -= xpNeeded;
      character.level += 1;
      character.skillPoints += 1;
      
      // Also update the active character reference
      if (activeCharacter) {
        activeCharacter.experience = character.experience;
        activeCharacter.level = character.level;
        activeCharacter.skillPoints = character.skillPoints;
      }
      
      console.log(`${character.name} leveled up to level ${character.level}!`);
      
      // Unlock new abilities based on level
      character.abilities.forEach(ability => {
        if (ability.unlockLevel === character.level) {
          // Ability is now available
          console.log(`${character.name} unlocked ability: ${ability.name}`);
        }
      });
    }
  }
  
  private calculateXpForNextLevel(currentLevel: number): number {
    // Simple exponential formula
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
  }
  
  public startMission(missionId: string, characterIds: string[]): boolean {
    const success = this.startMissionInternal(missionId, characterIds);
    if (success) this.saveGameState();
    return success;
  }
  
  private startMissionInternal(missionId: string, characterIds: string[]): boolean {
    const mission = this.gameState.missions.find(m => m.id === missionId);
    if (!mission) return false;
    
    // Validate that the characters exist and are active
    const validCharacterIds = characterIds.filter(id => 
      this.gameState.activeCharacters.some(c => c.id === id)
    );
    
    if (validCharacterIds.length === 0) {
      console.error("No valid characters selected for mission");
      return false;
    }
    
    // Check if the selected characters cover the required strengths
    const requiredStrengthsCovered = mission.requiredStrengths.every(requiredStrength => 
      validCharacterIds.some(charId => {
        const char = this.gameState.characters.find(c => c.id === charId);
        return char && char.gameStrength === requiredStrength;
      })
    );
    
    if (!requiredStrengthsCovered) {
      console.error("Selected characters don't cover all required strengths");
      return false;
    }
    
    // Check if any selected characters are already on a mission
    const charactersOnMissions = validCharacterIds.filter(charId => 
      this.isCharacterOnMission(charId)
    );
    
    if (charactersOnMissions.length > 0) {
      console.error("Some selected characters are already on a mission");
      return false;
    }
    
    // Pause training for characters on the mission
    for (const charId of validCharacterIds) {
      // Find the character in both arrays
      const character = this.gameState.characters.find(c => c.id === charId);
      const activeCharacter = this.gameState.activeCharacters.find(c => c.id === charId);
      
      if (character) {
        // Store current training status even if null
        character.pausedTraining = character.currentlyTraining;
        character.currentlyTraining = null;
        console.log(`Paused training for ${character.name}, stored: ${character.pausedTraining || 'none'}`);
      }
      
      // Also update active character reference
      if (activeCharacter) {
        activeCharacter.pausedTraining = activeCharacter.currentlyTraining;
        activeCharacter.currentlyTraining = null;
      }
    }
    
    // Create a mission with the assigned characters and add it to currentMissions
    const missionToAdd = {
      ...mission, 
      completionProgress: 0,
      assignedCharacters: validCharacterIds
    };
    
    this.gameState.currentMissions.push(missionToAdd);
    
    // Remove the mission from available missions
    this.gameState.missions = this.gameState.missions.filter(m => m.id !== missionId);
    
    return true;
  }
  
  public addActiveCharacter(characterId: string): boolean {
    const success = this.addActiveCharacterInternal(characterId);
    if (success) this.saveGameState();
    return success;
  }
  
  private addActiveCharacterInternal(characterId: string): boolean {
    if (!this.gameState.unlockedCharacters.includes(characterId)) {
      return false;
    }
    
    const character = this.gameState.characters.find(c => c.id === characterId);
    if (!character) return false;
    
    if (!this.gameState.activeCharacters.some(c => c.id === characterId)) {
      this.gameState.activeCharacters.push(character);
      this.calculateTeamSynergy();
      return true;
    }
    
    return false;
  }
  
  public removeActiveCharacter(characterId: string): boolean {
    const success = this.removeActiveCharacterInternal(characterId);
    if (success) this.saveGameState();
    return success;
  }
  
  private removeActiveCharacterInternal(characterId: string): boolean {
    const index = this.gameState.activeCharacters.findIndex(c => c.id === characterId);
    if (index === -1) return false;
    
    this.gameState.activeCharacters.splice(index, 1);
    this.calculateTeamSynergy();
    return true;
  }
  
  public unlockCharacter(characterId: string): boolean {
    const success = this.unlockCharacterInternal(characterId);
    if (success) this.saveGameState();
    return success;
  }
  
  private unlockCharacterInternal(characterId: string): boolean {
    if (this.gameState.unlockedCharacters.includes(characterId)) {
      return false;
    }
    
    const character = this.gameState.characters.find(c => c.id === characterId);
    if (!character) return false;
    
    // Add character to unlocked characters list
    this.gameState.unlockedCharacters.push(characterId);
    
    // Automatically add the character to active characters
    if (!this.gameState.activeCharacters.some(c => c.id === characterId)) {
      this.gameState.activeCharacters.push(character);
      console.log(`Automatically added ${character.name} to the active team`);
    }
    
    return true;
  }
  
  public getGameState(): GameState {
    return {...this.gameState};
  }
  
  public purchaseUpgrade(characterId: string, upgradeId: string): boolean {
    const character = this.gameState.characters.find(c => c.id === characterId);
    if (!character) return false;
    
    const upgrade = character.upgradeTree.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.unlocked || character.skillPoints < upgrade.cost) {
      return false;
    }
    
    // Check if required nodes are unlocked
    const allRequiredNodesUnlocked = upgrade.requiredNodes.every(nodeId => {
      const node = character.upgradeTree.find(n => n.id === nodeId);
      return node && node.unlocked;
    });
    
    if (!allRequiredNodesUnlocked) {
      return false;
    }
    
    // Purchase the upgrade
    upgrade.unlocked = true;
    character.skillPoints -= upgrade.cost;
    
    // Apply the upgrade effect
    upgrade.effect(character);
    
    return true;
  }
  
  // New method to process skill training for all characters
  private processSkillTraining(deltaTime: number): void {
    // Ensure deltaTime is positive to prevent negative experience gains
    if (deltaTime <= 0) {
      console.warn(`Invalid deltaTime: ${deltaTime}. Skipping skill training update.`);
      return;
    }
    
    this.gameState.activeCharacters.forEach(activeCharacter => {
      // Skip characters that are on a mission
      if (this.isCharacterOnMission(activeCharacter.id)) {
        return;
      }
      
      if (activeCharacter.currentlyTraining) {
        // Find the character in the main characters array to ensure we update both references
        const characterInArray = this.gameState.characters.find(c => c.id === activeCharacter.id);
        if (!characterInArray) {
          console.error(`Character ${activeCharacter.id} found in activeCharacters but not in main characters array`);
          return;
        }
        
        // Make sure both references have the same currentlyTraining value
        characterInArray.currentlyTraining = activeCharacter.currentlyTraining;
        
        // Find the skill in both character references
        const activeSkill = activeCharacter.skills.find(s => s.type === activeCharacter.currentlyTraining);
        const arraySkill = characterInArray.skills.find(s => s.type === characterInArray.currentlyTraining);
        
        if (activeSkill && arraySkill && activeSkill.level < activeSkill.maxLevel) {
          // Calculate experience gain and ensure it's always positive
          const expGain = Math.max(0, activeSkill.trainingRate * deltaTime);
          
          if (expGain <= 0) {
            console.warn(`No experience gained for ${activeCharacter.name}'s ${activeSkill.name} skill. Training rate: ${activeSkill.trainingRate}, deltaTime: ${deltaTime}`);
            return;
          }
          
          // Add experience to both skill references
          activeSkill.experience += expGain;
          arraySkill.experience += expGain;
          
          // Ensure experience is never negative
          if (activeSkill.experience < 0) activeSkill.experience = 0;
          if (arraySkill.experience < 0) arraySkill.experience = 0;
          
          // Check for level up using the active character reference
          if (activeSkill.experience >= activeSkill.experienceToNextLevel) {
            // Level up both references
            this.levelUpSkill(activeCharacter, activeSkill);
            this.levelUpSkill(characterInArray, arraySkill);
            
            console.log(`${activeCharacter.name}'s ${activeSkill.name} increased to level ${activeSkill.level}!`);
          }
        }
      }
    });
  }
  
  // Helper method to level up a skill
  private levelUpSkill(character: Character, skill: CharacterSkill): void {
    skill.experience -= skill.experienceToNextLevel;
    skill.level += 1;
    
    // Increase the experience needed for the next level
    skill.experienceToNextLevel = Math.floor(skill.experienceToNextLevel * 1.5);
    
    // Apply the skill's bonuses to the character
    this.applySkillBonuses(character);
  }
  
  // Method to add experience to a specific skill
  public addSkillExperience(characterId: string, skillType: SkillType, amount: number): void {
    // Skip if character is on a mission
    if (this.isCharacterOnMission(characterId)) {
      return;
    }
    
    // Ensure amount is positive
    if (amount <= 0) {
      console.warn(`Attempted to add non-positive experience (${amount}) to skill ${skillType} for character ${characterId}`);
      return;
    }
    
    // Find character in both arrays
    const character = this.gameState.characters.find(c => c.id === characterId);
    const activeCharacter = this.gameState.activeCharacters.find(c => c.id === characterId);
    
    if (!character) {
      console.error(`Character ${characterId} not found in characters array`);
      return;
    }
    
    const skill = character.skills.find(s => s.type === skillType);
    if (!skill || skill.level >= skill.maxLevel) return;
    
    // Add experience to the skill
    skill.experience += amount;
    
    // Ensure experience is never negative
    if (skill.experience < 0) skill.experience = 0;
    
    // If character is also in active characters, update that reference too
    if (activeCharacter) {
      const activeSkill = activeCharacter.skills.find(s => s.type === skillType);
      if (activeSkill) {
        activeSkill.experience = skill.experience;
      }
    }
    
    // Check for skill level up
    if (skill.experience >= skill.experienceToNextLevel) {
      this.levelUpSkill(character, skill);
      
      // Also level up the active character reference if it exists
      if (activeCharacter) {
        const activeSkill = activeCharacter.skills.find(s => s.type === skillType);
        if (activeSkill) {
          this.levelUpSkill(activeCharacter, activeSkill);
        }
      }
      
      console.log(`${character.name}'s ${skill.name} increased to level ${skill.level}!`);
    }
  }
  
  // Method to apply all skill bonuses to a character
  private applySkillBonuses(character: Character): void {
    // Reset base stats first
    const baseStats = characterData.find(c => c.id === character.id);
    if (!baseStats) return;
    
    character.strength = baseStats.strength;
    character.agility = baseStats.agility;
    character.intelligence = baseStats.intelligence;
    character.charisma = baseStats.charisma;
    
    // Apply all skill bonuses
    character.skills.forEach(skill => {
      if (skill.bonuses.strength) {
        character.strength += skill.bonuses.strength * skill.level;
      }
      if (skill.bonuses.agility) {
        character.agility += skill.bonuses.agility * skill.level;
      }
      if (skill.bonuses.intelligence) {
        character.intelligence += skill.bonuses.intelligence * skill.level;
      }
      if (skill.bonuses.charisma) {
        character.charisma += skill.bonuses.charisma * skill.level;
      }
      // Note: Other bonuses like resourceGain, missionSpeed, etc.
      // will be applied when calculating those values
    });
  }
  
  // Method to set which skill a character is currently training
  public setTrainingSkill(characterId: string, skillType: SkillType | null): boolean {
    const success = this.setTrainingSkillInternal(characterId, skillType);
    if (success) this.saveGameState();
    return success;
  }
  
  private setTrainingSkillInternal(characterId: string, skillType: SkillType | null): boolean {
    // Check if character is on a mission
    if (this.isCharacterOnMission(characterId)) {
      console.error(`Character ${characterId} is on a mission and cannot train skills`);
      return false;
    }
    
    // Find the character in both active characters and all characters
    let character = this.gameState.activeCharacters.find(c => c.id === characterId);
    
    // If not found in active characters, try to find in all characters 
    if (!character) {
      character = this.gameState.characters.find(c => c.id === characterId);
    }
    
    if (!character) {
      console.error(`Character with ID ${characterId} not found`);
      return false;
    }
    
    // Check if the skill exists for this character
    if (skillType && !character.skills.some(s => s.type === skillType)) {
      console.error(`Skill type ${skillType} not found for character ${character.name}`);
      return false;
    }
    
    console.log(`Setting ${character.name}'s training skill to ${skillType || 'none'}`);
    character.currentlyTraining = skillType;
    return true;
  }
  
  // Method to get a character's skill by type
  public getCharacterSkill(characterId: string, skillType: SkillType): CharacterSkill | null {
    const character = this.gameState.characters.find(c => c.id === characterId);
    if (!character) return null;
    
    return character.skills.find(s => s.type === skillType) || null;
  }
  
  // Helper method to calculate a character's resource gain bonus from skills
  private getCharacterResourceBonus(character: Character): number {
    return character.skills.reduce((bonus, skill) => {
      return bonus + (skill.bonuses.resourceGain || 0) * skill.level;
    }, 0);
  }
  
  // Method to check if a character is currently on a mission
  public isCharacterOnMission(characterId: string): boolean {
    // Ensure currentMissions is defined to avoid errors
    if (!this.gameState.currentMissions) {
      this.gameState.currentMissions = [];
      return false;
    }
    
    // Check if the character is assigned to any current mission
    return this.gameState.currentMissions.some(mission => 
      mission.assignedCharacters.includes(characterId)
    );
  }
  
  // When a mission completes, resume training for characters
  private resumeTrainingForCharacters(characterIds: string[]): void {
    console.log("Resuming training for characters:", characterIds);
    
    for (const charId of characterIds) {
      // Find character in both arrays
      const character = this.gameState.characters.find(c => c.id === charId);
      const activeCharacter = this.gameState.activeCharacters.find(c => c.id === charId);
      
      if (character && character.pausedTraining) {
        character.currentlyTraining = character.pausedTraining;
        character.pausedTraining = null;
        console.log(`Resumed training for ${character.name}: ${character.currentlyTraining}`);
      }
      
      // Also update active character reference
      if (activeCharacter && activeCharacter.pausedTraining) {
        activeCharacter.currentlyTraining = activeCharacter.pausedTraining;
        activeCharacter.pausedTraining = null;
      }
    }
  }
  
  // Method to purchase a character with gold and data points
  public purchaseCharacter(characterId: string, goldCost: number, dataCost: number): boolean {
    const success = this.purchaseCharacterInternal(characterId, goldCost, dataCost);
    if (success) this.saveGameState();
    return success;
  }
  
  private purchaseCharacterInternal(characterId: string, goldCost: number, dataCost: number): boolean {
    // Check if character is already unlocked
    if (this.gameState.unlockedCharacters.includes(characterId)) {
      return false;
    }
    
    // Find the character
    const character = this.gameState.characters.find(c => c.id === characterId);
    if (!character) return false;
    
    // Check if player has enough resources
    if (this.gameState.resources.gold < goldCost || this.gameState.resources.dataPoints < dataCost) {
      return false;
    }
    
    // Deduct resources
    this.gameState.resources.gold -= goldCost;
    this.gameState.resources.dataPoints -= dataCost;
    
    // Use unlockCharacterInternal instead of directly manipulating the array
    // This will also automatically add the character to the active team
    this.unlockCharacterInternal(characterId);
    
    // Check if this is the first unlocked character, generate missions if needed
    if (this.gameState.unlockedCharacters.length > 1 && this.gameState.missions.length === 0) {
      this.generateInitialMissions();
    }
    
    return true;
  }
  
  // Generate initial set of missions when more than one character is unlocked
  private generateInitialMissions(): void {
    const missionTypes = [
      {
        name: "Training Exercise",
        description: "A simple training mission to test your team's coordination.",
        difficulty: 1,
        rewards: { gold: 150, dataPoints: 75, teamMorale: 5, adaptationTokens: 1 },
        possibleStrengths: [GameStrength.TEAM_SUPPORT, GameStrength.JACK_OF_ALL_TRADES, GameStrength.PERSISTENT_TRAINING, GameStrength.UNBREAKABLE_PATIENCE]
      },
      {
        name: "Data Collection",
        description: "Gather important information from various sources.",
        difficulty: 1.5,
        rewards: { gold: 100, dataPoints: 200, teamMorale: 3, adaptationTokens: 1 },
        possibleStrengths: [GameStrength.GRINDING, GameStrength.SNIPING, GameStrength.HIGH_GAME_MODE, GameStrength.UNBREAKABLE_PATIENCE]
      },
      {
        name: "Strategic Planning",
        description: "Develop a tactical approach to an upcoming challenge.",
        difficulty: 2,
        rewards: { gold: 200, dataPoints: 150, teamMorale: 10, adaptationTokens: 2 },
        possibleStrengths: [GameStrength.TACTICAL_AREA_CONTROL, GameStrength.JACK_OF_ALL_TRADES, GameStrength.TEAM_SUPPORT]
      },
      {
        name: "Guard Duty",
        description: "Keep watch over valuable team assets and guard against threats.",
        difficulty: 1.3,
        rewards: { gold: 175, dataPoints: 100, teamMorale: 6, adaptationTokens: 1 },
        possibleStrengths: [GameStrength.UNBREAKABLE_PATIENCE, GameStrength.PERSISTENT_TRAINING, GameStrength.TEAM_SUPPORT]
      }
    ];
    
    // Add missions to the game state
    missionTypes.forEach((missionType, index) => {
      // Randomly select 2 required strengths
      const strengths = [...missionType.possibleStrengths];
      const requiredStrengths: GameStrength[] = [];
      
      const numRequired = Math.min(2, strengths.length);
      for (let i = 0; i < numRequired; i++) {
        const randomStrengthIndex = Math.floor(Math.random() * strengths.length);
        requiredStrengths.push(strengths[randomStrengthIndex]);
        strengths.splice(randomStrengthIndex, 1);
      }
      
      this.gameState.missions.push({
        id: `mission_${index + 1}`,
        name: missionType.name,
        description: missionType.description,
        duration: 60, // 60 seconds base duration
        difficulty: missionType.difficulty,
        rewards: missionType.rewards,
        requiredStrengths: requiredStrengths,
        completionProgress: 0,
        assignedCharacters: [] // New field to track assigned characters
      });
    });
  }
} 