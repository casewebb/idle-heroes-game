import { GameState, Character, Mission, Resources, SkillType, CharacterSkill, GameStrength } from '../types/Character';
import { characterData } from '../data/CharacterData';

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
        this.gameState = this.initializeGameState();
        console.log('Started new game with default character');
      }
    }
    
    this.lastTimestamp = Date.now();
    this.lastSaveTime = Date.now();
    
    this.setupAutoSave();
  }
  
  private setupAutoSave(): void {
    if (this.autoSaveTimer) {
      window.clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = window.setInterval(() => {
      this.saveGameState();
      this.lastSaveTime = Date.now();
      console.log('Auto-saved game state');
    }, AUTO_SAVE_INTERVAL);
    
    window.addEventListener('beforeunload', () => {
      this.saveGameState();
    });
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.saveGameState();
      }
    });
  }
  
  public cleanup(): void {
    if (this.autoSaveTimer) {
      window.clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    this.saveGameState();
  }
  
  private initializeGameState(startingCharacterId?: string): GameState {
    console.log("initializeGameState called with:", startingCharacterId);
    
    let startingCharacter;
    
    if (startingCharacterId) {
      startingCharacter = characterData.find(char => char.id === startingCharacterId);
      if (!startingCharacter) {
        console.log("Requested character not found, picking a random one instead");
        const randomIndex = Math.floor(Math.random() * characterData.length);
        startingCharacter = characterData[randomIndex];
      }
    } else {
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
      teamSynergy: 0,
      autoMission: false
    };
  }
  
  public update(): void {
    const currentTime = Date.now();
    let deltaTime = (currentTime - this.lastTimestamp) / 1000; // seconds
    this.lastTimestamp = currentTime;
    
    if (deltaTime < 0) {
      console.warn(`Negative deltaTime detected: ${deltaTime}. Setting to 0.1`);
      deltaTime = 0.1;
    }
    
    this.gameState.gameTime += deltaTime;
    
    // Update the last update time for offline progression tracking
    this.gameState.lastUpdateTime = Date.now() / 1000;
    
    if (!this.gameState.currentMissions) {
      this.gameState.currentMissions = [];
    }
    
    this.processIdleGains(deltaTime);
    
    if (this.gameState.currentMissions.length > 0) {
      this.processMission(deltaTime);
    }
    
    this.processSkillTraining(deltaTime);
    
    this.calculateTeamSynergy();
  }
  
  public saveGameState(): void {
    try {
      console.log('Saving game state');
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(this.gameState));
      this.lastSaveTime = Date.now();
      console.log('Game state saved');
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }
  
  public getTimeSinceLastSave(): number {
    return (Date.now() - this.lastSaveTime) / 1000;
  }
  
  private loadGameState(): GameState | null {
    try {
      const savedStateString = localStorage.getItem(GAME_STATE_KEY);
      if (!savedStateString) {
        console.log("No saved game state found in localStorage");
        return null;
      }
      
      console.log("Found saved game state in localStorage");
      const savedState = JSON.parse(savedStateString) as GameState;
      
      if (savedState.activeCharacters && savedState.activeCharacters.length > 0) {
        console.log("Loaded game has active character:", 
          savedState.activeCharacters[0].name, 
          savedState.activeCharacters[0].id);
      }
      
      this.restoreFunctionReferences(savedState);
      
      return savedState;
    } catch (error) {
      console.error('Error loading game state:', error);
      return null;
    }
  }
  
  private restoreFunctionReferences(state: GameState): void {
    state.characters.forEach(character => {
      const originalChar = characterData.find(c => c.id === character.id);
      if (originalChar) {
        character.abilities.forEach((ability, index) => {
          if (originalChar.abilities[index]) {
            ability.effect = originalChar.abilities[index].effect;
          }
        });
        
        character.upgradeTree.forEach((upgrade, index) => {
          if (originalChar.upgradeTree[index]) {
            upgrade.effect = originalChar.upgradeTree[index].effect;
          }
        });
        
        if (character.currentlyTraining) {
          const hasSkill = character.skills.some(s => s.type === character.currentlyTraining);
          if (!hasSkill) {
            character.currentlyTraining = null;
          }
        }
        
        // Initialize originalTraining field if not present
        if (character.originalTraining === undefined) {
          character.originalTraining = character.currentlyTraining;
        }
        
        character.skills.forEach((skill, index) => {
          if (skill.experience < 0) skill.experience = 0;
          if (skill.experience > skill.experienceToNextLevel) {
            skill.experience = skill.experienceToNextLevel - 1;
          }
          
          if (skill.level > skill.maxLevel) {
            skill.level = skill.maxLevel;
          }
          
          if (!skill.trainingRate || skill.trainingRate <= 0) {
            console.warn(`Fixing zero/negative training rate for ${character.name}'s ${skill.name} skill`);
            if (originalChar.skills[index] && originalChar.skills[index].trainingRate > 0) {
              skill.trainingRate = originalChar.skills[index].trainingRate;
            } else {
              skill.trainingRate = 0.5;
            }
          }
        });
      }
    });
    
    const validCharacterIds = state.characters.map(c => c.id);
    
    state.activeCharacters = state.activeCharacters.filter(character => 
      validCharacterIds.includes(character.id)
    );
    
    state.unlockedCharacters = state.unlockedCharacters.filter(id => 
      validCharacterIds.includes(id)
    );
    
    if (state.activeCharacters.length === 0 && state.unlockedCharacters.length > 0) {
      const firstUnlockedId = state.unlockedCharacters[0];
      const character = state.characters.find(c => c.id === firstUnlockedId);
      if (character) {
        state.activeCharacters.push(character);
      }
    }
    
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
  
  public resetGame(startingCharacterId?: string): void {
    console.log("Resetting game with character ID:", startingCharacterId);
    
    localStorage.removeItem(GAME_STATE_KEY);
    
    this.gameState = this.initializeGameState(startingCharacterId);
    this.saveGameState();
    console.log('Game state reset and saved');
  }
  
  private processIdleGains(deltaTime: number): void {
    const goldGain = this.calculateIdleGoldGain() * deltaTime * this.idleMultiplier;
    const dataPointsGain = this.calculateIdleDataPointsGain() * deltaTime * this.idleMultiplier;
    
    // Apply gains
    this.gameState.resources.gold += goldGain;
    this.gameState.resources.dataPoints += dataPointsGain;
  }
  
  private calculateIdleGoldGain(): number {
    return this.gameState.activeCharacters.reduce((total, character) => {
      const resourceBonus = this.getCharacterResourceBonus(character);
      return total + (character.level * 0.5) * (1 + resourceBonus);
    }, 0);
  }
  
  private calculateIdleDataPointsGain(): number {
    const dataMultiplier = this.gameState.unlockedCharacters.includes("josiah") ? 1.5 : 1.0;
    
    return this.gameState.activeCharacters.reduce((total, character) => {
      const resourceBonus = this.getCharacterResourceBonus(character);
      return total + ((character.intelligence * 0.2) * dataMultiplier) * (1 + resourceBonus);
    }, 0);
  }
  
  private processMission(deltaTime: number): void {
    if (!this.gameState.currentMissions) {
      this.gameState.currentMissions = [];
      return;
    }
    
    if (this.gameState.currentMissions.length === 0) return;
    
    const completedMissionIndices: number[] = [];
    
    this.gameState.currentMissions.forEach((mission, index) => {
      const progressRate = this.calculateMissionProgressRate(mission);
      
      mission.completionProgress += progressRate * deltaTime;
      
      if (mission.completionProgress >= 100) {
        completedMissionIndices.push(index);
      }
    });
    
    for (let i = completedMissionIndices.length - 1; i >= 0; i--) {
      const missionIndex = completedMissionIndices[i];
      this.completeMission(missionIndex);
    }
  }
  
  private calculateMissionProgressRate(mission: Mission): number {
    if (!mission) return 0;
    
    let baseRate = 1.0;
    
    const strengthCoverage = mission.requiredStrengths.filter(strength => 
      mission.assignedCharacters.some(charId => {
        const char = this.gameState.characters.find(c => c.id === charId);
        return char && char.gameStrength === strength;
      })
    ).length / mission.requiredStrengths.length;
    
    let missionTeamSynergy = 0;
    const assignedChars = mission.assignedCharacters.map(id => 
      this.gameState.characters.find(c => c.id === id)
    ).filter(Boolean) as Character[];
    
    const uniqueClasses = new Set(assignedChars.map(char => char.characterClass));
    missionTeamSynergy += uniqueClasses.size * 5;
    
    baseRate *= (1 + (missionTeamSynergy / 100));
    
    baseRate *= (0.5 + (strengthCoverage * 0.5));
    
    baseRate /= mission.difficulty;
    
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
    if (!this.gameState.currentMissions) {
      this.gameState.currentMissions = [];
      return;
    }
    
    if (this.gameState.currentMissions.length === 0) return;
    
    const rewards = this.gameState.currentMissions[index].rewards;
    this.gameState.resources.gold += rewards.gold;
    this.gameState.resources.dataPoints += rewards.dataPoints;
    this.gameState.resources.teamMorale += rewards.teamMorale;
    this.gameState.resources.adaptationTokens += rewards.adaptationTokens;
    
    for (const characterId of this.gameState.currentMissions[index].assignedCharacters) {
      const xpGain = 10 * this.gameState.currentMissions[index].difficulty;
      this.awardExperience(characterId, xpGain);
    }
    
    const missionDifficulty = this.gameState.currentMissions[index].difficulty;
    const unlockChance = missionDifficulty * 0.1;
    
    if (Math.random() < unlockChance) {
      this.tryUnlockRandomCharacter();
    }
    
    const assignedCharacters = [...this.gameState.currentMissions[index].assignedCharacters];
    
    // Generate a new mission to replace the completed one
    this.generateNewMission();
    
    // Remove the completed mission
    this.gameState.currentMissions.splice(index, 1);
    
    // Handle auto-mission feature
    if (this.gameState.autoMission && this.gameState.missions.length > 0) {
      const allCharactersUnlocked = this.canEnableAutoMission();
      if (allCharactersUnlocked) {
        this.startAutoMission(assignedCharacters);
      } else {
        this.resumeTrainingForCharacters(assignedCharacters);
      }
    } else {
      // Resume training for characters that were on the mission
      this.resumeTrainingForCharacters(assignedCharacters);
    }
    
    this.saveGameState();
  }
  
  private startAutoMission(characterIds: string[]): boolean {
    if (this.gameState.missions.length === 0) return false;
    
    // Pick the first available mission
    const missionId = this.gameState.missions[0].id;
    
    // Try to start the mission with the same characters
    const success = this.startMissionInternal(missionId, characterIds);
    
    if (!success) {
      // If failed, resume training for the characters
      this.resumeTrainingForCharacters(characterIds);
    }
    
    return success;
  }
  
  public getLastUnlockedCharacter(): Character | null {
    return this.lastUnlockedCharacter;
  }
  
  public clearLastUnlockedCharacter(): void {
    this.lastUnlockedCharacter = null;
  }
  
  private tryUnlockRandomCharacter(): void {
    const unlockedSet = new Set(this.gameState.unlockedCharacters);
    const lockedCharacters = this.gameState.characters
      .filter(char => !unlockedSet.has(char.id));
    
    if (lockedCharacters.length > 0) {
      const randomIndex = Math.floor(Math.random() * lockedCharacters.length);
      const characterToUnlock = lockedCharacters[randomIndex];
      
      this.unlockCharacter(characterToUnlock.id);
      
      this.lastUnlockedCharacter = characterToUnlock;
      
      console.log(`Unlocked new character: ${characterToUnlock.name}!`);
    }
  }
  
  private generateNewMission(): void {
    const baselineDifficulty = 1 + (this.gameState.unlockedCharacters.length * 0.2);
    
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
    
    const randomIndex = Math.floor(Math.random() * missionTypes.length);
    const missionType = missionTypes[randomIndex];
    
    const difficulty = baselineDifficulty * missionType.difficultyMod;
    
    const scaledRewards = {
      gold: Math.floor(missionType.rewards.gold * difficulty),
      dataPoints: Math.floor(missionType.rewards.dataPoints * difficulty),
      teamMorale: Math.floor(missionType.rewards.teamMorale),
      adaptationTokens: missionType.rewards.adaptationTokens
    };
    
    const strengths = [...missionType.possibleStrengths];
    const requiredStrengths: GameStrength[] = [];
    
    const numRequired = Math.min(2, strengths.length);
    for (let i = 0; i < numRequired; i++) {
      const randomStrengthIndex = Math.floor(Math.random() * strengths.length);
      requiredStrengths.push(strengths[randomStrengthIndex]);
      strengths.splice(randomStrengthIndex, 1);
    }
    
    const newMission: Mission = {
      id: `mission_${Date.now()}`,
      name: missionType.name,
      description: missionType.description,
      duration: 60 * difficulty,
      difficulty: difficulty,
      rewards: scaledRewards,
      requiredStrengths: requiredStrengths,
      completionProgress: 0,
      assignedCharacters: []
    };
    
    this.gameState.missions.push(newMission);
  }
  
  private calculateTeamSynergy(): void {
    const activeCharacters = this.gameState.activeCharacters;
    
    let synergy = 0;
    
    const uniqueClasses = new Set(activeCharacters.map(char => char.characterClass));
    synergy += uniqueClasses.size * 5;
    
    if (this.hasCharacterCombo(["daniel", "kyle"])) {
      synergy += 10;
    }
    
    if (this.hasCharacterCombo(["vinny", "ben"])) {
      synergy += 10;
    }
    
    this.gameState.teamSynergy = synergy;
  }
  
  private hasCharacterCombo(characterIds: string[]): boolean {
    return characterIds.every(id => 
      this.gameState.activeCharacters.some(char => char.id === id)
    );
  }
  
  public awardExperience(characterId: string, amount: number): void {
    if (amount <= 0) {
      console.warn(`Attempted to award non-positive experience (${amount}) to character ${characterId}`);
      return;
    }
    
    const character = this.gameState.characters.find(c => c.id === characterId);
    const activeCharacter = this.gameState.activeCharacters.find(c => c.id === characterId);
    
    if (!character) {
      console.error(`Character ${characterId} not found in characters array`);
      return;
    }
    
    character.experience += amount;
    console.log(`Awarded ${amount} XP to ${character.name} (${characterId})`);
    
    if (activeCharacter) {
      activeCharacter.experience = character.experience;
    }
    
    const xpNeeded = this.calculateXpForNextLevel(character.level);
    if (character.experience >= xpNeeded) {
      character.experience -= xpNeeded;
      character.level += 1;
      character.skillPoints += 1;
      
      if (activeCharacter) {
        activeCharacter.experience = character.experience;
        activeCharacter.level = character.level;
        activeCharacter.skillPoints = character.skillPoints;
      }
      
      console.log(`${character.name} leveled up to level ${character.level}!`);
      
      character.abilities.forEach(ability => {
        if (ability.unlockLevel === character.level) {
          console.log(`${character.name} unlocked ability: ${ability.name}`);
        }
      });
    }
  }
  
  private calculateXpForNextLevel(currentLevel: number): number {
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
    
    const validCharacterIds = characterIds.filter(id => 
      this.gameState.activeCharacters.some(c => c.id === id)
    );
    
    if (validCharacterIds.length === 0) {
      console.error("No valid characters selected for mission");
      return false;
    }
    
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
    
    const charactersOnMissions = validCharacterIds.filter(charId => 
      this.isCharacterOnMission(charId)
    );
    
    if (charactersOnMissions.length > 0) {
      console.error("Some selected characters are already on a mission");
      return false;
    }
    
    for (const charId of validCharacterIds) {
      const character = this.gameState.characters.find(c => c.id === charId);
      const activeCharacter = this.gameState.activeCharacters.find(c => c.id === charId);
      
      if (character) {
        // Store the original training state if this is the first mission for this character
        // or if auto-missions are enabled but originalTraining is not set
        if ((character.originalTraining === undefined || character.originalTraining === null) &&
            (this.gameState.autoMission || !character.pausedTraining)) {
          character.originalTraining = character.currentlyTraining;
          console.log(`Stored original training for ${character.name}: ${character.originalTraining || 'none'}`);
        }
        
        character.pausedTraining = character.currentlyTraining;
        character.currentlyTraining = null;
        console.log(`Paused training for ${character.name}, stored: ${character.pausedTraining || 'none'}`);
      }
      
      if (activeCharacter) {
        // Also store for active character if it's the first mission or auto-missions enabled
        if ((activeCharacter.originalTraining === undefined || activeCharacter.originalTraining === null) &&
            (this.gameState.autoMission || !activeCharacter.pausedTraining)) {
          activeCharacter.originalTraining = activeCharacter.currentlyTraining;
        }
        
        activeCharacter.pausedTraining = activeCharacter.currentlyTraining;
        activeCharacter.currentlyTraining = null;
      }
    }
    
    const missionToAdd = {
      ...mission, 
      completionProgress: 0,
      assignedCharacters: validCharacterIds
    };
    
    this.gameState.currentMissions.push(missionToAdd);
    
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
    
    this.gameState.unlockedCharacters.push(characterId);
    
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
    
    const allRequiredNodesUnlocked = upgrade.requiredNodes.every(nodeId => {
      const node = character.upgradeTree.find(n => n.id === nodeId);
      return node && node.unlocked;
    });
    
    if (!allRequiredNodesUnlocked) {
      return false;
    }
    
    upgrade.unlocked = true;
    character.skillPoints -= upgrade.cost;
    
    upgrade.effect(character);
    
    return true;
  }
  
  private processSkillTraining(deltaTime: number): void {
    if (deltaTime <= 0) {
      console.warn(`Invalid deltaTime: ${deltaTime}. Skipping skill training update.`);
      return;
    }
    
    this.gameState.activeCharacters.forEach(activeCharacter => {
      if (this.isCharacterOnMission(activeCharacter.id)) {
        return;
      }
      
      if (activeCharacter.currentlyTraining) {
        const characterInArray = this.gameState.characters.find(c => c.id === activeCharacter.id);
        if (!characterInArray) {
          console.error(`Character ${activeCharacter.id} found in activeCharacters but not in main characters array`);
          return;
        }
        
        characterInArray.currentlyTraining = activeCharacter.currentlyTraining;
        
        const activeSkill = activeCharacter.skills.find(s => s.type === activeCharacter.currentlyTraining);
        const arraySkill = characterInArray.skills.find(s => s.type === characterInArray.currentlyTraining);
        
        if (activeSkill && arraySkill && activeSkill.level < activeSkill.maxLevel) {
          const expGain = Math.max(0, activeSkill.trainingRate * deltaTime);
          
          if (expGain <= 0) {
            console.warn(`No experience gained for ${activeCharacter.name}'s ${activeSkill.name} skill. Training rate: ${activeSkill.trainingRate}, deltaTime: ${deltaTime}`);
            return;
          }
          
          activeSkill.experience += expGain;
          arraySkill.experience += expGain;
          
          // Ensure experience is never negative
          if (activeSkill.experience < 0) activeSkill.experience = 0;
          if (arraySkill.experience < 0) arraySkill.experience = 0;
          
          if (activeSkill.experience >= activeSkill.experienceToNextLevel) {
            this.levelUpSkill(activeCharacter, activeSkill);
            this.levelUpSkill(characterInArray, arraySkill);
            
            console.log(`${activeCharacter.name}'s ${activeSkill.name} increased to level ${activeSkill.level}!`);
          }
        }
      }
    });
  }
  
  private levelUpSkill(character: Character, skill: CharacterSkill): void {
    skill.experience -= skill.experienceToNextLevel;
    skill.level += 1;
    
    skill.experienceToNextLevel = Math.floor(skill.experienceToNextLevel * 1.5);
    
    this.applySkillBonuses(character);
  }
  
  public addSkillExperience(characterId: string, skillType: SkillType, amount: number): void {
    if (this.isCharacterOnMission(characterId)) {
      return;
    }
    
    if (amount <= 0) {
      console.warn(`Attempted to add non-positive experience (${amount}) to skill ${skillType} for character ${characterId}`);
      return;
    }
    
    const character = this.gameState.characters.find(c => c.id === characterId);
    const activeCharacter = this.gameState.activeCharacters.find(c => c.id === characterId);
    
    if (!character) {
      console.error(`Character ${characterId} not found in characters array`);
      return;
    }
    
    const skill = character.skills.find(s => s.type === skillType);
    if (!skill || skill.level >= skill.maxLevel) return;
    
    skill.experience += amount;
    
    if (skill.experience < 0) skill.experience = 0;
    
    if (activeCharacter) {
      const activeSkill = activeCharacter.skills.find(s => s.type === skillType);
      if (activeSkill) {
        activeSkill.experience = skill.experience;
      }
    }
    
    if (skill.experience >= skill.experienceToNextLevel) {
      this.levelUpSkill(character, skill);
      
      if (activeCharacter) {
        const activeSkill = activeCharacter.skills.find(s => s.type === skillType);
        if (activeSkill) {
          this.levelUpSkill(activeCharacter, activeSkill);
        }
      }
      
      console.log(`${character.name}'s ${skill.name} increased to level ${skill.level}!`);
    }
  }
  
  private applySkillBonuses(character: Character): void {
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
  
  public setTrainingSkill(characterId: string, skillType: SkillType | null): boolean {
    const success = this.setTrainingSkillInternal(characterId, skillType);
    console.log('Successfully set training skill for ', characterId, skillType, success);
    if (success) this.saveGameState();
    return success;
  }
  
  private setTrainingSkillInternal(characterId: string, skillType: SkillType | null): boolean {
    if (this.isCharacterOnMission(characterId)) {
      console.error(`Character ${characterId} is on a mission and cannot train skills`);
      return false;
    }
    
    let character = this.gameState.activeCharacters.find(c => c.id === characterId);
    
    if (!character) {
      character = this.gameState.characters.find(c => c.id === characterId);
    }
    
    if (!character) {
      console.error(`Character with ID ${characterId} not found`);
      return false;
    }
    
    if (skillType && !character.skills.some(s => s.type === skillType)) {
      console.error(`Skill type ${skillType} not found for character ${character.name}`);
      return false;
    }
    
    console.log(`Setting ${character.name}'s training skill to ${skillType || 'none'}`);
    character.currentlyTraining = skillType;
    return true;
  }
  
  public getCharacterSkill(characterId: string, skillType: SkillType): CharacterSkill | null {
    const character = this.gameState.characters.find(c => c.id === characterId);
    if (!character) return null;
    
    return character.skills.find(s => s.type === skillType) || null;
  }
  
  private getCharacterResourceBonus(character: Character): number {
    return character.skills.reduce((bonus, skill) => {
      return bonus + (skill.bonuses.resourceGain || 0) * skill.level;
    }, 0);
  }
  
  public isCharacterOnMission(characterId: string): boolean {
    if (!this.gameState.currentMissions) return false;
    
    return this.gameState.currentMissions.some(mission => 
      mission.assignedCharacters.includes(characterId)
    );
  }
  
  public cancelMission(missionIndex: number): boolean {
    try {
      // Check if the mission index is valid
      if (missionIndex < 0 || !this.gameState.currentMissions || 
          missionIndex >= this.gameState.currentMissions.length) {
        console.error(`Invalid mission index: ${missionIndex}`);
        return false;
      }
      
      // Get the mission and its assigned characters
      const mission = this.gameState.currentMissions[missionIndex];
      const assignedCharacters = [...mission.assignedCharacters];
      
      // Create a copy of the mission with reset progress and no assigned characters
      const missionToAdd = {
        ...mission,
        completionProgress: 0,
        assignedCharacters: []
      };
      
      // Remove from current missions
      this.gameState.currentMissions.splice(missionIndex, 1);
      
      // Add to available missions
      this.gameState.missions.push(missionToAdd);
      
      // Resume training for characters
      this.resumeTrainingForCharacters(assignedCharacters);
      
      // Save changes
      this.saveGameState();
      
      console.log(`Successfully canceled mission: ${mission.name}`);
      return true;
    } catch (error) {
      console.error("Error canceling mission:", error);
      return false;
    }
  }
  
  public toggleAutoMission(): boolean {
    // Auto-mission can only be enabled if all characters are unlocked
    const allCharactersUnlocked = this.gameState.characters.every(character => 
      this.gameState.unlockedCharacters.includes(character.id)
    );
    
    if (!allCharactersUnlocked && !this.gameState.autoMission) {
      console.log("Auto-mission feature requires all characters to be unlocked");
      return false;
    }
    
    // Toggle the auto-mission state
    this.gameState.autoMission = !this.gameState.autoMission;
    console.log(`Auto-mission ${this.gameState.autoMission ? 'enabled' : 'disabled'}`);
    
    // If disabling auto-mission, clear all original training states
    if (!this.gameState.autoMission) {
      this.gameState.characters.forEach(character => {
        character.originalTraining = null;
      });
      
      // Also clear for active characters
      this.gameState.activeCharacters.forEach(character => {
        character.originalTraining = null;
      });
    } 
    // If enabling auto-mission, save current training states as original if not on mission
    else {
      this.gameState.characters.forEach(character => {
        if (!this.isCharacterOnMission(character.id) && character.originalTraining === null) {
          character.originalTraining = character.currentlyTraining;
        }
      });
      
      this.gameState.activeCharacters.forEach(character => {
        if (!this.isCharacterOnMission(character.id) && character.originalTraining === null) {
          character.originalTraining = character.currentlyTraining;
        }
      });
    }
    
    this.saveGameState();
    return true;
  }
  
  public updateMissions(currentMissions: Mission[], availableMissions: Mission[]): void {
    this.gameState.currentMissions = currentMissions;
    this.gameState.missions = availableMissions;
  }
  
  public canEnableAutoMission(): boolean {
    return this.gameState.characters.every(character => 
      this.gameState.unlockedCharacters.includes(character.id)
    );
  }
  
  public resumeTrainingForCharacters(characterIds: string[]): void {
    console.log("Resuming training for characters:", characterIds);
    const autoMissionsEnabled = this.gameState.autoMission;
    
    for (const charId of characterIds) {
      const character = this.gameState.characters.find(c => c.id === charId);
      const activeCharacter = this.gameState.activeCharacters.find(c => c.id === charId);
      
      if (character) {
        // Prioritize original training state regardless of auto-mission status
        if (character.originalTraining !== null && character.originalTraining !== undefined) {
          character.currentlyTraining = character.originalTraining;
          console.log(`Restored original training for ${character.name}: ${character.currentlyTraining || 'none'}`);
        } else if (character.pausedTraining) {
          character.currentlyTraining = character.pausedTraining;
          console.log(`Resumed training for ${character.name}: ${character.currentlyTraining || 'none'}`);
        }
        character.pausedTraining = null;
      }
      
      if (activeCharacter) {
        // Prioritize original training state regardless of auto-mission status
        if (activeCharacter.originalTraining !== null && activeCharacter.originalTraining !== undefined) {
          activeCharacter.currentlyTraining = activeCharacter.originalTraining;
        } else if (activeCharacter.pausedTraining) {
          activeCharacter.currentlyTraining = activeCharacter.pausedTraining;
        }
        activeCharacter.pausedTraining = null;
      }
    }
    
    // Only clear original training when explicitly disabling auto-missions
    if (!autoMissionsEnabled) {
      for (const charId of characterIds) {
        const character = this.gameState.characters.find(c => c.id === charId);
        const activeCharacter = this.gameState.activeCharacters.find(c => c.id === charId);
        
        if (character) {
          character.originalTraining = null;
        }
        
        if (activeCharacter) {
          activeCharacter.originalTraining = null;
        }
      }
    }
  }
  
  public purchaseCharacter(characterId: string, goldCost: number, dataCost: number): boolean {
    const success = this.purchaseCharacterInternal(characterId, goldCost, dataCost);
    if (success) this.saveGameState();
    return success;
  }
  
  private purchaseCharacterInternal(characterId: string, goldCost: number, dataCost: number): boolean {
    if (this.gameState.unlockedCharacters.includes(characterId)) {
      return false;
    }
    
    const character = this.gameState.characters.find(c => c.id === characterId);
    if (!character) return false;
    
    if (this.gameState.resources.gold < goldCost || this.gameState.resources.dataPoints < dataCost) {
      return false;
    }
    
    this.gameState.resources.gold -= goldCost;
    this.gameState.resources.dataPoints -= dataCost;
    
    this.unlockCharacterInternal(characterId);
    
    if (this.gameState.unlockedCharacters.length > 1 && this.gameState.missions.length === 0) {
      this.generateInitialMissions();
    }
    
    return true;
  }
  
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
    
    missionTypes.forEach((missionType, index) => {
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
        assignedCharacters: []
      });
    });
  }
  
  public updateLastUpdateTime(timestamp: number): void {
    this.gameState.lastUpdateTime = timestamp;
  }
} 