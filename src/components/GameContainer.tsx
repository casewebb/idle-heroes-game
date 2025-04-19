import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { GameState, Character, Mission, SkillType, GameStrength } from '../types/Character';
import { characterData } from '../data/CharacterData';
import './GameContainer.css';

import CharacterSelectScreen from './game/CharacterSelectScreen';
import ResourceBar from './game/ResourceBar';
import TabNavigation, { UITab } from './game/TabNavigation';
import GameTab from './game/GameTab';
import ShopTab from './game/ShopTab';
import MissionsTab from './game/MissionsTab';
import CharacterUnlockPopup from './game/CharacterUnlockPopup';
import MissionSelectionDialog from './game/MissionSelectionDialog';

import { checkForSavedGame, calculateTotalResourceRate } from './game/utils';

const GameContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasSelectedCharacter, setHasSelectedCharacter] = useState<boolean>(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UITab>(UITab.GAME); // Current active tab
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(checkForSavedGame());
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [showSaveIndicator, setShowSaveIndicator] = useState<boolean>(false);
  const [unlockedCharacter, setUnlockedCharacter] = useState<Character | null>(null);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedMissionCharacters, setSelectedMissionCharacters] = useState<string[]>([]);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const requestRef = useRef<number>();
  const saveIndicatorTimeoutRef = useRef<number | null>(null);
  const [offlineGains, setOfflineGains] = useState<{
    time: number, 
    gold: number, 
    dataPoints: number,
    completedMissions: number
  } | null>(null);

  const handleCharacterSelect = (characterId: string) => {
    console.log("Selected character with ID:", characterId);
    
    gameEngineRef.current = new GameEngine(characterId);
    setHasSelectedCharacter(true);
  };

  const handleContinueGame = () => {
    gameEngineRef.current = new GameEngine();
    setHasSelectedCharacter(true);
  };

  const handleResetGame = () => {
    if (window.confirm('Are you sure you want to reset your game? All progress will be lost!')) {
      if (gameEngineRef.current) {
        gameEngineRef.current.resetGame();
        
        localStorage.removeItem('idle_heroes_game_state');
        
        setHasSelectedCharacter(false);
        setHasSavedGame(false);
        setGameState(null);
        setSelectedCharacterId(null);
        
        console.log('Game reset complete');
      }
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem('idle_heroes_game_state');
    console.log("Cleared localStorage");
    setHasSavedGame(false);
  };

  const handleSelectCharacterTab = (characterId: string) => {
    setSelectedCharacterId(characterId);
  };

  const handleSelectSkill = (characterId: string, skillType: SkillType | null) => {
    if (!gameEngineRef.current) {
      console.error("Game engine not initialized");
      return;
    }
    
    try {
      const success = gameEngineRef.current.setTrainingSkill(characterId, skillType);
      console.log('Successfully set training skill for ', characterId, skillType, success);
      if (!success) {
        console.warn(`Failed to set training skill ${skillType} for character ${characterId}`);
      }
    } catch (error) {
      console.error("Error setting training skill:", error);
    }
  };

  const handleManualSave = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.saveGameState();
      
      setShowSaveIndicator(true);
      
      if (saveIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(saveIndicatorTimeoutRef.current);
      }
      
      saveIndicatorTimeoutRef.current = window.setTimeout(() => {
        setShowSaveIndicator(false);
        saveIndicatorTimeoutRef.current = null;
      }, 2000);
    }
  };

  const gameLoop = () => {
    if (!gameEngineRef.current) return;
    
    const gameEngine = gameEngineRef.current;
    gameEngine.update();
    const newGameState = gameEngine.getGameState();
    
    const unlockedChar = gameEngine.getLastUnlockedCharacter();
    if (unlockedChar) {
      setUnlockedCharacter(unlockedChar);
      gameEngine.clearLastUnlockedCharacter();
    }
    
    setGameState(newGameState);
    
    setLastSaveTime(gameEngine.getTimeSinceLastSave());
    
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const closeUnlockedCharacterPopup = () => {
    setUnlockedCharacter(null);
  };

  const handleToggleMissionCharacter = (characterId: string) => {
    if (gameEngineRef.current?.isCharacterOnMission(characterId)) {
      return; // Don't allow selecting character already on a mission
    }
    
    setSelectedMissionCharacters(prev => {
      if (prev.includes(characterId)) {
        return prev.filter(id => id !== characterId);
      } else {
        return [...prev, characterId];
      }
    });
  };

  const areMissionRequirementsMet = (mission: Mission, characterIds: string[]): boolean => {
    if (!gameState) return false;
    
    return mission.requiredStrengths.every(requiredStrength => 
      characterIds.some(charId => {
        const char = gameState.characters.find(c => c.id === charId);
        return char && char.gameStrength === requiredStrength;
      })
    );
  };

  const handleStartMission = () => {
    if (!gameEngineRef.current || !selectedMissionId || selectedMissionCharacters.length === 0) return;
    
    const mission = gameState?.missions.find(m => m.id === selectedMissionId);
    if (!mission) return;
    
    if (!areMissionRequirementsMet(mission, selectedMissionCharacters)) {
      alert("Your team doesn't have all the required strengths for this mission!");
      return;
    }
    
    gameEngineRef.current.startMission(selectedMissionId, selectedMissionCharacters);
    
    setSelectedMissionId(null);
    setSelectedMissionCharacters([]);
  };

  const handleCancelMission = () => {
    setSelectedMissionId(null);
    setSelectedMissionCharacters([]);
  };

  const handleBeginMission = (missionId: string) => {
    setSelectedMissionCharacters([]);
    setSelectedMissionId(missionId);
  };

  const isCharacterOnMission = (characterId: string): boolean => {
    return !!gameEngineRef.current?.isCharacterOnMission(characterId);
  };

  const handlePurchaseCharacter = (characterId: string, goldPrice: number, dataPrice: number) => {
    if (gameEngineRef.current) {
      gameEngineRef.current.purchaseCharacter(characterId, goldPrice, dataPrice);
    }
  };

  const handleToggleAutoMission = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.toggleAutoMission();
    }
  };
  
  const canEnableAutoMission = (): boolean => {
    return gameEngineRef.current?.canEnableAutoMission() ?? false;
  };

  useEffect(() => {
    if (hasSelectedCharacter && gameEngineRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
      }
      
      if (saveIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(saveIndicatorTimeoutRef.current);
      }
    };
  }, [hasSelectedCharacter]);
  
  useEffect(() => {
    setHasSavedGame(checkForSavedGame());
  }, []);

  useEffect(() => {
    if (hasSelectedCharacter) return; // Only run offline progress check when first mounting
    
    const gameEngine = new GameEngine();
    
    // Check for offline progress
    const currentGameState = gameEngine.getGameState();
    const currentTime = Date.now() / 1000; 
    const timeSinceLastPlay = currentTime - (currentGameState.lastUpdateTime || currentTime);
    
    if (timeSinceLastPlay > 120) { 
      // Calculate offline gains
      const goldPerSecond = currentGameState.activeCharacters.reduce((total, character) => {
        const resourceBonus = character.skills.reduce((bonus, skill) => {
          return bonus + (skill.bonuses.resourceGain || 0) * skill.level;
        }, 0);
        return total + (character.level * 0.5) * (1 + resourceBonus);
      }, 0);
      
      const dataMultiplier = currentGameState.unlockedCharacters.includes("josiah") ? 1.5 : 1.0;
      const dataPerSecond = currentGameState.activeCharacters.reduce((total, character) => {
        const resourceBonus = character.skills.reduce((bonus, skill) => {
          return bonus + (skill.bonuses.resourceGain || 0) * skill.level;
        }, 0);
        return total + ((character.intelligence * 0.2) * dataMultiplier) * (1 + resourceBonus);
      }, 0);
      
      // Apply offline gains directly to resources
      currentGameState.resources.gold += Math.floor(goldPerSecond * timeSinceLastPlay);
      currentGameState.resources.dataPoints += Math.floor(dataPerSecond * timeSinceLastPlay);
      
      // Process mission progress for offline time
      let completedMissions = 0;
      let resourcesGained = {
        gold: 0,
        dataPoints: 0,
        teamMorale: 0,
        adaptationTokens: 0
      };
      
      // If auto-missions are enabled, we can complete multiple missions in a chain
      if (currentGameState.autoMission && timeSinceLastPlay > 120) {
        // Calculate how many mission cycles we can complete
        const timeRemaining = timeSinceLastPlay;
        let timeUsed = 0;
        
        // Loop until we've used up all the offline time
        while (timeUsed < timeRemaining) {
          // Process current missions first
          const missionsToProcess = [...currentGameState.currentMissions];
          let missionTimeUsed = 0;
          
          // Skip if no active missions
          if (missionsToProcess.length === 0) break;
          
          for (let i = 0; i < missionsToProcess.length; i++) {
            const mission = missionsToProcess[i];
            
            // Calculate mission progress rate
            const progressRate = calculateMissionProgressRate(mission, currentGameState);
            
            // Calculate time needed to complete this mission
            const timeToComplete = (100 - mission.completionProgress) / progressRate;
            
            // Check if we have enough time left to complete the mission
            if (timeToComplete + timeUsed <= timeRemaining) {
              // Complete the mission
              completedMissions++;
              
              // Add rewards to our accumulator
              resourcesGained.gold += mission.rewards.gold;
              resourcesGained.dataPoints += mission.rewards.dataPoints;
              resourcesGained.teamMorale += mission.rewards.teamMorale;
              resourcesGained.adaptationTokens += mission.rewards.adaptationTokens;
              
              // Award XP to characters
              mission.assignedCharacters.forEach(charId => {
                const character = currentGameState.characters.find(c => c.id === charId);
                if (character) {
                  character.experience += 10 * mission.difficulty;
                }
              });
              
              // Store the character IDs for potential new missions
              const assignedCharacters = [...mission.assignedCharacters];
              
              // Remove completed mission from game state
              currentGameState.currentMissions = currentGameState.currentMissions.filter(m => m.id !== mission.id);
              
              // Add the time used to complete this mission
              missionTimeUsed = Math.max(missionTimeUsed, timeToComplete);
              
              // Generate a new mission
              generateOfflineMission(currentGameState);
              
              // Start a new mission with the same team if we have available missions
              if (currentGameState.missions.length > 0) {
                const newMissionId = currentGameState.missions[0].id;
                startOfflineMission(currentGameState, newMissionId, assignedCharacters);
              }
            } else {
              // We don't have enough time to complete this mission, just update progress
              const progressMade = progressRate * (timeRemaining - timeUsed);
              mission.completionProgress += progressMade;
            }
          }
          
          // If we didn't make any progress in this cycle, break out
          if (missionTimeUsed <= 0) break;
          
          // Add the time used in this cycle
          timeUsed += missionTimeUsed;
        }
        
        // Apply accumulated resources at once
        currentGameState.resources.gold += resourcesGained.gold;
        currentGameState.resources.dataPoints += resourcesGained.dataPoints;
        currentGameState.resources.teamMorale += resourcesGained.teamMorale;
        currentGameState.resources.adaptationTokens += resourcesGained.adaptationTokens;
      } else {
        // Original non-auto-mission logic for offline progress
        // Update mission progress based on time passed
        if (currentGameState.currentMissions.length > 0) {
          const missionsToComplete: number[] = [];
          
          currentGameState.currentMissions.forEach((mission, index) => {
            // Calculate mission progress rate using similar logic to the game engine
            let progressRate = calculateMissionProgressRate(mission, currentGameState);
            
            // Advance the mission progress based on offline time
            const newProgress = mission.completionProgress + (progressRate * timeSinceLastPlay);
            
            if (newProgress >= 100) {
              // Mark this mission as completed
              missionsToComplete.push(index);
            } else {
              // Update progress
              mission.completionProgress = newProgress;
            }
          });
          
          // Process completed missions (from last to first to avoid index issues)
          for (let i = missionsToComplete.length - 1; i >= 0; i--) {
            const missionIndex = missionsToComplete[i];
            const mission = currentGameState.currentMissions[missionIndex];
            const assignedCharacters = [...mission.assignedCharacters];
            
            // Add rewards
            currentGameState.resources.gold += mission.rewards.gold;
            currentGameState.resources.dataPoints += mission.rewards.dataPoints;
            currentGameState.resources.teamMorale += mission.rewards.teamMorale;
            currentGameState.resources.adaptationTokens += mission.rewards.adaptationTokens;
            
            // Accumulate for reporting purposes
            resourcesGained.gold += mission.rewards.gold;
            resourcesGained.dataPoints += mission.rewards.dataPoints;
            resourcesGained.teamMorale += mission.rewards.teamMorale;
            resourcesGained.adaptationTokens += mission.rewards.adaptationTokens;
            
            // Award XP to characters
            mission.assignedCharacters.forEach(charId => {
              const character = currentGameState.characters.find(c => c.id === charId);
              if (character) {
                character.experience += 10 * mission.difficulty;
              }
            });
            
            // Remove completed mission
            currentGameState.currentMissions.splice(missionIndex, 1);
            completedMissions++;
            
            // Generate a new mission to replace completed one
            generateOfflineMission(currentGameState);
            
            // If auto-missions are enabled, assign the characters to a new mission
            if (currentGameState.autoMission && currentGameState.missions.length > 0) {
              const newMissionId = currentGameState.missions[0].id;
              startOfflineMission(currentGameState, newMissionId, assignedCharacters);
            } else {
              // Resume training for the characters if auto-missions are off
              resumeTrainingForOfflineCharacters(currentGameState, assignedCharacters);
            }
          }
        }
      }
      
      // Show notification about offline gains
      setOfflineGains({
        time: Math.floor(timeSinceLastPlay / 60),
        gold: Math.floor(goldPerSecond * timeSinceLastPlay) + resourcesGained.gold,
        dataPoints: Math.floor(dataPerSecond * timeSinceLastPlay) + resourcesGained.dataPoints,
        completedMissions: completedMissions
      });
      
      // Update the game state with applied offline gains
      gameEngine.updateLastUpdateTime(Date.now() / 1000);
      gameEngine.saveGameState();
    }
    
    // Don't create a gameEngine here, we'll use the one from handleCharacterSelect or handleContinueGame
  }, [hasSelectedCharacter]);

  // Helper function to calculate mission progress rate (simplified version of game engine logic)
  function calculateMissionProgressRate(mission: Mission, gameState: GameState): number {
    if (!mission) return 0;
    
    let baseRate = 1.0;
    
    // Check if mission has the required strengths
    const strengthCoverage = mission.requiredStrengths.filter(strength => 
      mission.assignedCharacters.some(charId => {
        const char = gameState.characters.find(c => c.id === charId);
        return char && char.gameStrength === strength;
      })
    ).length / mission.requiredStrengths.length;
    
    // Calculate team synergy (simplified)
    const uniqueClasses = new Set(
      mission.assignedCharacters
        .map(id => gameState.characters.find(c => c.id === id)?.characterClass)
        .filter(Boolean)
    );
    
    const missionTeamSynergy = uniqueClasses.size * 5;
    
    baseRate *= (1 + (missionTeamSynergy / 100));
    baseRate *= (0.5 + (strengthCoverage * 0.5));
    baseRate /= mission.difficulty;
    
    // Add mission speed bonuses from character skills
    const missionSpeedBonus = mission.assignedCharacters.reduce((bonus, charId) => {
      const character = gameState.characters.find(c => c.id === charId);
      if (!character) return bonus;
      
      return bonus + character.skills.reduce((charBonus, skill) => {
        return charBonus + (skill.bonuses.missionSpeed || 0) * skill.level;
      }, 0);
    }, 0);
    
    baseRate *= (1 + missionSpeedBonus);
    
    return baseRate;
  }

  // Helper function to simulate generating a new mission
  function generateOfflineMission(gameState: GameState): void {
    const baselineDifficulty = 1 + (gameState.unlockedCharacters.length * 0.2);
    const missionTypes = [
      {
        name: "Resource Gathering",
        description: "Collect vital resources for the team.",
        difficultyMod: 0.8,
        rewards: { gold: 200, dataPoints: 100, teamMorale: 3, adaptationTokens: 1 },
      },
      {
        name: "Tactical Operation",
        description: "Execute a precise maneuver requiring coordination.",
        difficultyMod: 1.2,
        rewards: { gold: 150, dataPoints: 150, teamMorale: 5, adaptationTokens: 2 },
      },
      {
        name: "Speed Run",
        description: "Complete an objective as quickly as possible.",
        difficultyMod: 1.0,
        rewards: { gold: 120, dataPoints: 120, teamMorale: 8, adaptationTokens: 2 },
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
    
    // Get some random required strengths
    const allStrengths = Object.values(GameStrength);
    const requiredStrengths: GameStrength[] = [];
    
    for (let i = 0; i < 2; i++) {
      const randomStrength = allStrengths[Math.floor(Math.random() * allStrengths.length)];
      if (!requiredStrengths.includes(randomStrength)) {
        requiredStrengths.push(randomStrength);
      }
    }
    
    const newMission: Mission = {
      id: `mission_offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: missionType.name,
      description: missionType.description,
      duration: 60 * difficulty,
      difficulty: difficulty,
      rewards: scaledRewards,
      requiredStrengths: requiredStrengths,
      completionProgress: 0,
      assignedCharacters: []
    };
    
    gameState.missions.push(newMission);
  }

  // Helper function to simulate starting a mission offline
  function startOfflineMission(gameState: GameState, missionId: string, characterIds: string[]): void {
    const mission = gameState.missions.find(m => m.id === missionId);
    if (!mission) return;
    
    // Save training states for characters
    for (const charId of characterIds) {
      const character = gameState.characters.find(c => c.id === charId);
      if (character) {
        if (character.originalTraining === null) {
          character.originalTraining = character.currentlyTraining;
        }
        character.pausedTraining = character.currentlyTraining;
        character.currentlyTraining = null;
      }
    }
    
    const missionToAdd = {
      ...mission,
      completionProgress: 0,
      assignedCharacters: characterIds
    };
    
    gameState.currentMissions.push(missionToAdd);
    gameState.missions = gameState.missions.filter(m => m.id !== missionId);
  }

  // Helper function to resume training for characters after missions
  function resumeTrainingForOfflineCharacters(gameState: GameState, characterIds: string[]): void {
    for (const charId of characterIds) {
      const character = gameState.characters.find(c => c.id === charId);
      
      if (character) {
        if (character.originalTraining !== null && character.originalTraining !== undefined) {
          character.currentlyTraining = character.originalTraining;
        } else if (character.pausedTraining) {
          character.currentlyTraining = character.pausedTraining;
        }
        character.pausedTraining = null;
      }
    }
    
    // Clear original training if auto-missions are disabled
    if (!gameState.autoMission) {
      for (const charId of characterIds) {
        const character = gameState.characters.find(c => c.id === charId);
        if (character) {
          character.originalTraining = null;
        }
      }
    }
  }

  if (!hasSelectedCharacter) {
    return (
      <CharacterSelectScreen
        characters={characterData}
        hasSavedGame={hasSavedGame}
        onCharacterSelect={handleCharacterSelect}
        onContinueGame={handleContinueGame}
        onClearStorage={handleClearStorage}
        onStartNewGame={() => setHasSavedGame(false)}
      />
    );
  }

  if (!gameState) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="game-container">
      {offlineGains && (
        <div className="offline-gains-notification">
          <h3>Welcome Back!</h3>
          <p>While you were away for {offlineGains.time} minutes:</p>
          <ul>
            <li>You earned {offlineGains.gold} gold</li>
            <li>You gained {offlineGains.dataPoints} data points</li>
            {offlineGains.completedMissions > 0 && (
              <>
                <li>
                  <strong>{offlineGains.completedMissions} {offlineGains.completedMissions === 1 ? 'mission was' : 'missions were'} completed!</strong>
                </li>
                {gameState.autoMission && (
                  <li className="auto-missions-detail">Auto-missions kept your team busy</li>
                )}
              </>
            )}
            {gameState.currentMissions.length > 0 && (
              <li>Your active missions made progress</li>
            )}
            {gameState.activeCharacters.some(c => c.currentlyTraining) && (
              <li>Your characters continued their training</li>
            )}
          </ul>
          <button onClick={() => setOfflineGains(null)} className="close-button">
            Great!
          </button>
        </div>
      )}
      
      <header className="game-header">
        <h1>Idle Heroes: Guild of Unlikely Heroes</h1>
        
        <ResourceBar 
          resources={gameState.resources}
          onSaveGame={handleManualSave}
          onResetGame={handleResetGame}
          lastSaveTime={lastSaveTime}
          showSaveIndicator={showSaveIndicator}
        />
        
        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </header>

      {/* Character Unlock Popup */}
      {unlockedCharacter && (
        <CharacterUnlockPopup 
          character={unlockedCharacter}
          onClose={closeUnlockedCharacterPopup}
        />
      )}

      {/* Mission Selection Popup */}
      {selectedMissionId && gameState && (
        <MissionSelectionDialog
          mission={gameState.missions.find(m => m.id === selectedMissionId)!}
          availableCharacters={gameState.activeCharacters}
          selectedCharacterIds={selectedMissionCharacters}
          onToggleCharacter={handleToggleMissionCharacter}
          onStartMission={handleStartMission}
          onCancel={handleCancelMission}
          isCharacterOnMission={isCharacterOnMission}
        />
      )}

      {/* Game Tab */}
      {activeTab === UITab.GAME && (
        <GameTab 
          gameState={gameState}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacterTab}
          onSelectSkill={handleSelectSkill}
          isCharacterOnMission={isCharacterOnMission}
        />
      )}

      {/* Shop Tab */}
      {activeTab === UITab.SHOP && (
        <ShopTab 
          gameState={gameState}
          onPurchaseCharacter={handlePurchaseCharacter}
        />
      )}

      {/* Missions Tab */}
      {activeTab === UITab.MISSIONS && (
        <MissionsTab 
          gameState={gameState}
          onBeginMission={handleBeginMission}
          onToggleAutoMission={handleToggleAutoMission}
          canEnableAutoMission={canEnableAutoMission()}
        />
      )}
    </div>
  );
};

export default GameContainer; 