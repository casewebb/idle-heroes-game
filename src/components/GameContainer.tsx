import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { GameState, Character, Mission, SkillType, CharacterSkill } from '../types/Character';
import { characterData } from '../data/CharacterData';
import './GameContainer.css';

// Helper function to calculate XP required for next level
const calculateXpForNextLevel = (currentLevel: number): number => {
  return Math.round(100 * Math.pow(1.5, currentLevel));
};

// Skill type display names for UI
const skillTypeNames: Record<SkillType, string> = {
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
const formatClassName = (characterClass: string): string => {
  // Convert values like "data_master" to "Data Master"
  return characterClass
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format game strength name
const formatGameStrength = (gameStrength: string): string => {
  return gameStrength
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Skill training UI component
const SkillTrainingPanel = ({ character, onSelectSkill, isOnMission }: { 
  character: Character, 
  onSelectSkill: (skillType: SkillType | null) => void,
  isOnMission: boolean 
}) => {
  return (
    <div className="skill-training-panel">
      <h3>Training</h3>
      
      {isOnMission ? (
        <div className="mission-training-notice">
          <p>This character is currently on a mission and cannot train skills until they return.</p>
        </div>
      ) : character.currentlyTraining ? (
        <div className="current-training">
          <p>
            Currently training: <strong>{character.skills.find(s => s.type === character.currentlyTraining)?.name}</strong>
          </p>
          <button onClick={() => onSelectSkill(null)}>Stop Training</button>
        </div>
      ) : (
        <p>Not currently training any skills</p>
      )}
      
      <div className="skills-list">
        <h4>Available Skills</h4>
        {character.skills.map(skill => (
          <div key={skill.type} className="skill-item">
            <div className="skill-header">
              <h5>{skill.name}</h5>
              <div className="skill-level">Level {skill.level}</div>
            </div>
            <p>{skill.description}</p>
            <div className="skill-progress">
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{width: `${(skill.experience / skill.experienceToNextLevel) * 100}%`}}
                ></div>
              </div>
              <span>{Math.floor(skill.experience)} / {skill.experienceToNextLevel} XP</span>
            </div>
            <div className="skill-bonuses">
              {skill.bonuses.strength ? <span>+{Math.round(skill.bonuses.strength * skill.level * 10) / 10} STR</span> : null}
              {skill.bonuses.agility ? <span>+{Math.round(skill.bonuses.agility * skill.level * 10) / 10} AGI</span> : null}
              {skill.bonuses.intelligence ? <span>+{Math.round(skill.bonuses.intelligence * skill.level * 10) / 10} INT</span> : null}
              {skill.bonuses.charisma ? <span>+{Math.round(skill.bonuses.charisma * skill.level * 10) / 10} CHA</span> : null}
              {skill.bonuses.resourceGain ? <span>+{Math.floor(skill.bonuses.resourceGain * skill.level * 100)}% Resources</span> : null}
              {skill.bonuses.missionSpeed ? <span>+{Math.floor(skill.bonuses.missionSpeed * skill.level * 100)}% Mission Speed</span> : null}
              {skill.bonuses.abilityEffectiveness ? <span>+{Math.floor(skill.bonuses.abilityEffectiveness * skill.level * 100)}% Ability Effect</span> : null}
            </div>
            <button 
              onClick={() => onSelectSkill(skill.type)}
              disabled={character.currentlyTraining === skill.type || skill.level >= skill.maxLevel || isOnMission}
              className={skill.level >= skill.maxLevel ? "max-level" : isOnMission ? "disabled" : ""}
            >
              {skill.level >= skill.maxLevel ? "Max Level" : 
                character.currentlyTraining === skill.type ? "Training" : "Train"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enum for UI tabs
enum UITab {
  GAME = "game",
  SHOP = "shop",
  MISSIONS = "missions"
}

// Check if a saved game exists
const checkForSavedGame = (): boolean => {
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

  const handleCharacterSelect = (characterId: string) => {
    // Add debugging
    console.log("Selected character with ID:", characterId);
    
    // Initialize the game engine with the selected character
    gameEngineRef.current = new GameEngine(characterId);
    setHasSelectedCharacter(true);
  };

  const handleContinueGame = () => {
    // Continue with saved game data
    gameEngineRef.current = new GameEngine();
    setHasSelectedCharacter(true);
  };

  const handleResetGame = () => {
    if (window.confirm('Are you sure you want to reset your game? All progress will be lost!')) {
      if (gameEngineRef.current) {
        gameEngineRef.current.resetGame();
        
        // Clear saved game from localStorage directly
        localStorage.removeItem('idle_heroes_game_state');
        
        // Update the UI state without reloading
        setHasSelectedCharacter(false);
        setHasSavedGame(false);
        setGameState(null);
        setSelectedCharacterId(null);
        
        console.log('Game reset complete');
      }
    }
  };

  // Add debug function to clear localStorage
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
      if (!success) {
        console.warn(`Failed to set training skill ${skillType} for character ${characterId}`);
      }
    } catch (error) {
      console.error("Error setting training skill:", error);
    }
  };

  // Manual save handler
  const handleManualSave = () => {
    if (gameEngineRef.current) {
      // Force a save
      gameEngineRef.current.saveGameState();
      
      // Show save indicator
      setShowSaveIndicator(true);
      
      // Clear previous timeout if it exists
      if (saveIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(saveIndicatorTimeoutRef.current);
      }
      
      // Hide the indicator after 2 seconds
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
    
    // Check if a character was just unlocked
    const unlockedChar = gameEngine.getLastUnlockedCharacter();
    if (unlockedChar) {
      setUnlockedCharacter(unlockedChar);
      // Clear the last unlocked character in the engine
      gameEngine.clearLastUnlockedCharacter();
    }
    
    setGameState(newGameState);
    
    // Update last save time display
    setLastSaveTime(gameEngine.getTimeSinceLastSave());
    
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Function to close the character unlock popup
  const closeUnlockedCharacterPopup = () => {
    setUnlockedCharacter(null);
  };

  // Function to handle character selection for missions
  const handleToggleMissionCharacter = (characterId: string) => {
    // Check if character is already on a mission
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

  // Function to check if all mission requirements are met
  const areMissionRequirementsMet = (mission: Mission, characterIds: string[]): boolean => {
    if (!gameState) return false;
    
    // Check if the selected characters cover all required strengths
    return mission.requiredStrengths.every(requiredStrength => 
      characterIds.some(charId => {
        const char = gameState.characters.find(c => c.id === charId);
        return char && char.gameStrength === requiredStrength;
      })
    );
  };

  // Function to start a mission with selected characters
  const handleStartMission = () => {
    if (!gameEngineRef.current || !selectedMissionId || selectedMissionCharacters.length === 0) return;
    
    const mission = gameState?.missions.find(m => m.id === selectedMissionId);
    if (!mission) return;
    
    // Check if requirements are met
    if (!areMissionRequirementsMet(mission, selectedMissionCharacters)) {
      alert("Your team doesn't have all the required strengths for this mission!");
      return;
    }
    
    // Start the mission with selected characters
    gameEngineRef.current.startMission(selectedMissionId, selectedMissionCharacters);
    
    // Reset selection state
    setSelectedMissionId(null);
    setSelectedMissionCharacters([]);
  };

  // Function to cancel mission selection
  const handleCancelMission = () => {
    setSelectedMissionId(null);
    setSelectedMissionCharacters([]);
  };

  useEffect(() => {
    // Only start the game loop if character has been selected
    if (hasSelectedCharacter && gameEngineRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      // Cleanup when unmounting
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      // Clean up the game engine (which will also save the game one last time)
      if (gameEngineRef.current) {
        gameEngineRef.current.cleanup();
      }
      
      // Clean up save indicator timeout
      if (saveIndicatorTimeoutRef.current !== null) {
        window.clearTimeout(saveIndicatorTimeoutRef.current);
      }
    };
  }, [hasSelectedCharacter]);
  
  // Check for saved game data when component mounts
  useEffect(() => {
    // Update hasSavedGame state based on localStorage
    setHasSavedGame(checkForSavedGame());
  }, []);

  // Character selection screen
  if (!hasSelectedCharacter) {
    return (
      <div className="character-select-container">
        <h1>Idle Heroes: Guild of Unlikely Heroes</h1>
        
        {hasSavedGame && (
          <div className="saved-game-banner">
            <h2>Welcome Back!</h2>
            <p>We found a saved game. Would you like to continue where you left off?</p>
            <div className="saved-game-actions">
              <button className="continue-button" onClick={handleContinueGame}>
                Continue Game
              </button>
              <button className="new-game-button" onClick={() => setHasSavedGame(false)}>
                Start New Game
              </button>
            </div>
          </div>
        )}
        
        {!hasSavedGame && (
          <>
            <h2>Select Your Starting Hero</h2>
            <p>Choose your first friend to begin your adventure!</p>
            
            {/* Debug button */}
            <button 
              onClick={handleClearStorage}
              style={{ marginBottom: "20px" }}
            >
              Clear Saved Data
            </button>
            
            <div className="character-selection">
              {characterData.map((character) => (
                <div key={character.id} className="character-select-card">
                  <h2>{character.name}</h2>
                  <div className="character-image">
                    {/* You can add character images here */}
                    <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(character.characterClass) }}></div>
                  </div>
                  <p><strong>Class:</strong> {formatClassName(character.characterClass)}</p>
                  <p><strong>Specialty:</strong> {formatGameStrength(character.gameStrength)}</p>
                  <p className="character-background">{character.background}</p>
                  <button onClick={() => handleCharacterSelect(character.id)}>
                    Select {character.name}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (!gameState) {
    return <div className="loading">Loading...</div>;
  }

  // Default to the first active character if none is selected
  const effectiveSelectedCharId = selectedCharacterId || gameState.activeCharacters[0]?.id;
  const selectedCharacter = gameState.activeCharacters.find(c => c.id === effectiveSelectedCharId);

  // Mission selection dialog
  const renderMissionSelectionDialog = () => {
    if (!selectedMissionId || !gameState) return null;
    
    const mission = gameState.missions.find(m => m.id === selectedMissionId);
    if (!mission) return null;
    
    // Get characters that can be selected (active ones)
    const availableCharacters = gameState.activeCharacters;
    
    // Check if requirements are met with current selection
    const requirementsMet = areMissionRequirementsMet(mission, selectedMissionCharacters);
    
    return (
      <div className="popup-overlay">
        <div className="mission-selection-popup">
          <div className="popup-header">
            <h2>Select Characters for Mission</h2>
            <button className="close-button" onClick={handleCancelMission}>×</button>
          </div>
          <div className="popup-content">
            <div className="mission-details">
              <h3>{mission.name}</h3>
              <p>{mission.description}</p>
              <div className="mission-required-strengths">
                <p><strong>Required Strengths:</strong></p>
                <div className="strengths-list">
                  {mission.requiredStrengths.map((strength, index) => (
                    <span key={index} className={`strength-tag ${
                      selectedMissionCharacters.some(charId => {
                        const char = gameState.characters.find(c => c.id === charId);
                        return char && char.gameStrength === strength;
                      }) ? 'fulfilled' : ''
                    }`}>
                      {formatGameStrength(strength)}
                    </span>
                  ))}
                </div>
              </div>
              <p><strong>Select characters to send on this mission:</strong></p>
              <div className="mission-character-selection">
                {availableCharacters.map(character => {
                  // Check if character is already on a mission
                  const isOnMission = gameEngineRef.current?.isCharacterOnMission(character.id) || false;
                  
                  return (
                    <div 
                      key={character.id}
                      className={`mission-character-option 
                        ${selectedMissionCharacters.includes(character.id) ? 'selected' : ''}
                        ${mission.requiredStrengths.includes(character.gameStrength) ? 'strength-match' : ''}
                        ${isOnMission ? 'on-mission-disabled' : ''}
                      `}
                      onClick={() => !isOnMission && handleToggleMissionCharacter(character.id)}
                      title={isOnMission ? "This character is already on a mission" : ""}
                    >
                      <div className="character-portrait">
                        <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(character.characterClass) }}></div>
                      </div>
                      <div className="character-details">
                        <h4>{character.name}</h4>
                        <p>Lv. {character.level} {formatClassName(character.characterClass)}</p>
                        <p><strong>Specialty:</strong> {formatGameStrength(character.gameStrength)}</p>
                        {isOnMission && (
                          <p className="mission-status">On Mission</p>
                        )}
                      </div>
                      <div className="character-selection-indicator">
                        {selectedMissionCharacters.includes(character.id) ? '✓' : 
                         isOnMission ? '🚀' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mission-selection-note">
                <strong>Note:</strong> Characters on missions cannot train skills until they return.
              </p>
            </div>
          </div>
          <div className="popup-actions">
            <button 
              className="start-mission-button" 
              onClick={handleStartMission}
              disabled={selectedMissionCharacters.length === 0 || !requirementsMet}
            >
              {!requirementsMet ? 'Mission Requirements Not Met' : 'Start Mission'}
            </button>
            <button className="cancel-button" onClick={handleCancelMission}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the active missions section in the missions tab
  const renderActiveMissions = () => {
    if (!gameState) return null;
    
    // Check if there are any active missions
    if (gameState.currentMissions.length === 0) {
      return (
        <div className="no-active-missions">
          <p>You don't have any active missions at the moment.</p>
          <p>Select a mission from the available missions to get started!</p>
        </div>
      );
    }
    
    // Render each active mission
    return (
      <div className="active-missions">
        <h3>Active Missions</h3>
        <div className="active-missions-grid">
          {gameState.currentMissions.map((mission, index) => {
            const assignedCharacters = mission.assignedCharacters.map(id => 
              gameState.characters.find(c => c.id === id)
            ).filter(Boolean);
            
            return (
              <div key={mission.id} className="active-mission-card">
                <div className="mission-header">
                  <h4>{mission.name}</h4>
                  <div className="mission-progress-display">
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{width: `${mission.completionProgress}%`}}
                      ></div>
                    </div>
                    <span>{Math.floor(mission.completionProgress)}%</span>
                  </div>
                </div>
                
                <p className="mission-description">{mission.description}</p>
                
                <div className="mission-details-grid">
                  <div className="mission-team">
                    <h5>Team:</h5>
                    <div className="mission-team-members">
                      {assignedCharacters.map((char: any) => (
                        <div key={char.id} className="team-member">
                          <div className="placeholder-image" style={{ 
                            backgroundColor: getColorForCharacter(char.characterClass),
                            width: '20px',
                            height: '20px'
                          }}></div>
                          <span>{char.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mission-rewards">
                    <h5>Rewards:</h5>
                    <div className="rewards-list">
                      {mission.rewards.gold > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.gold}</span> Gold</div>}
                      {mission.rewards.dataPoints > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.dataPoints}</span> Data</div>}
                      {mission.rewards.teamMorale > 0 && <div className="reward-item"><span className="reward-value">+{mission.rewards.teamMorale}</span> Morale</div>}
                      {mission.rewards.adaptationTokens > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.adaptationTokens}</span> Tokens</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Update available missions display
  const renderAvailableMissions = () => {
    if (!gameState) return null;
    
    if (gameState.missions.length === 0) {
      return <p>No missions available at the moment. Check back later!</p>;
    }
    
    return (
      <div className="mission-grid">
        {gameState.missions.map(mission => (
          <div key={mission.id} className="mission-card">
            <div className="mission-card-header">
              <h4>{mission.name}</h4>
              <div className="mission-difficulty">
                <strong>Difficulty:</strong> {mission.difficulty.toFixed(1)}
              </div>
            </div>
            <p className="mission-description">{mission.description}</p>
            
            <div className="mission-card-details">
              <div className="mission-requirements">
                <h5>Required Strengths:</h5>
                <div className="required-strengths">
                  {mission.requiredStrengths.map((strength, index) => (
                    <div key={index} className="strength-tag">
                      {formatGameStrength(strength)}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mission-rewards-compact">
                <h5>Rewards:</h5>
                <div className="rewards-grid">
                  {mission.rewards.gold > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.gold}</span> Gold</div>}
                  {mission.rewards.dataPoints > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.dataPoints}</span> Data</div>}
                  {mission.rewards.teamMorale > 0 && <div className="reward-item"><span className="reward-value">+{mission.rewards.teamMorale}</span> Morale</div>}
                  {mission.rewards.adaptationTokens > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.adaptationTokens}</span> Tokens</div>}
                </div>
              </div>
            </div>
            
            <button 
              className="begin-mission-button"
              onClick={() => {
                // Clear selected characters first
                setSelectedMissionCharacters([]);
                // Then set the mission ID
                setSelectedMissionId(mission.id);
              }}
            >
              Begin Mission
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Idle Heroes: Guild of Unlikely Heroes</h1>
        <div className="resource-bar">
          <div className="resource">
            <div>Gold:</div><span>{Math.floor(gameState.resources.gold)}</span>
          </div>
          <div className="resource">
            <div>Data Points:</div><span>{Math.floor(gameState.resources.dataPoints)}</span>
          </div>
          <div className="resource">
            <div>Team Morale:</div><span>{Math.floor(gameState.resources.teamMorale)}</span>
          </div>
          <div className="resource">
            <div>Adaptation Tokens:</div><span>{Math.floor(gameState.resources.adaptationTokens)}</span>
          </div>
          <div className="game-actions">
            {showSaveIndicator && (
              <div className="save-indicator">Game Saved!</div>
            )}
            <button 
              className="save-button" 
              onClick={handleManualSave} 
              title="Save your game now"
            >
              Save Game
            </button>
            <button 
              className="reset-button" 
              onClick={handleResetGame} 
              title="Reset your game progress"
            >
              Reset Game
            </button>
            <div className="auto-save-info" title="Game auto-saves every 5 minutes">
              {lastSaveTime < 60 ? 
                "Saved just now" : 
                `Last saved ${Math.floor(lastSaveTime / 60)} min ago`}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={activeTab === UITab.GAME ? "active" : ""}
            onClick={() => setActiveTab(UITab.GAME)}
          >
            Game
          </button>
          <button 
            className={activeTab === UITab.SHOP ? "active" : ""}
            onClick={() => setActiveTab(UITab.SHOP)}
          >
            Character Shop
          </button>
          <button 
            className={activeTab === UITab.MISSIONS ? "active" : ""}
            onClick={() => setActiveTab(UITab.MISSIONS)}
          >
            Missions
          </button>
        </div>
      </header>

      {/* Character Unlock Popup */}
      {unlockedCharacter && (
        <div className="popup-overlay">
          <div className="character-unlock-popup">
            <div className="popup-header">
              <h2>New Character Unlocked!</h2>
              <button className="close-button" onClick={closeUnlockedCharacterPopup}>×</button>
            </div>
            <div className="popup-content">
              <div className="unlock-character-portrait">
                <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(unlockedCharacter.characterClass) }}></div>
              </div>
              <div className="unlock-character-info">
                <h3>{unlockedCharacter.name}</h3>
                <p><strong>Class:</strong> {formatClassName(unlockedCharacter.characterClass)}</p>
                <p><strong>Specialty:</strong> {formatGameStrength(unlockedCharacter.gameStrength)}</p>
                <div className="unlock-character-stats">
                  <div className="stat-small"><span>STR</span> {Math.floor(unlockedCharacter.strength)}</div>
                  <div className="stat-small"><span>AGI</span> {Math.floor(unlockedCharacter.agility)}</div>
                  <div className="stat-small"><span>INT</span> {Math.floor(unlockedCharacter.intelligence)}</div>
                  <div className="stat-small"><span>CHA</span> {Math.floor(unlockedCharacter.charisma)}</div>
                </div>
                <p className="unlock-character-background">{unlockedCharacter.background}</p>
                <p className="character-added-notice">This character has been automatically added to your team!</p>
              </div>
            </div>
            <div className="popup-actions">
              <button 
                className="close-button-large"
                onClick={() => {
                  // Character is already automatically added to the team in GameEngine.unlockCharacterInternal
                  closeUnlockedCharacterPopup();
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mission Selection Popup */}
      {selectedMissionId && renderMissionSelectionDialog()}

      {/* Game Tab */}
      {activeTab === UITab.GAME && (
        <div className="game-content">
          <div className="left-column">
            <div className="character-roster">
              <h2>Active Characters</h2>
              <div className="character-tabs">
                {gameState.activeCharacters.map((character: Character) => (
                  <div 
                    key={character.id} 
                    className={`character-tab ${character.id === effectiveSelectedCharId ? 'active' : ''} ${gameEngineRef.current?.isCharacterOnMission(character.id) ? 'on-mission' : ''}`}
                    onClick={() => handleSelectCharacterTab(character.id)}
                  >
                    <div className="character-info-row">
                      <div className="character-tab-name">{character.name}</div>
                      <div className="character-level">Lv. {character.level}</div>
                    </div>
                    <div className="character-tab-specialty">{formatGameStrength(character.gameStrength)}</div>
                    
                    {/* Character experience progress bar */}
                    <div className="character-experience">
                      <div className="progress-bar mini">
                        <div 
                          className="progress" 
                          style={{
                            width: `${(character.experience / calculateXpForNextLevel(character.level)) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="exp-text">
                        {Math.floor(character.experience)}/{calculateXpForNextLevel(character.level)} XP
                      </div>
                    </div>
                    
                    <div className="character-indicators">
                      {character.currentlyTraining && (
                        <div className="training-indicator" title={`Training ${character.skills.find(s => s.type === character.currentlyTraining)?.name}`}>
                          🔄
                        </div>
                      )}
                      {gameEngineRef.current?.isCharacterOnMission(character.id) && (
                        <div className="mission-indicator" title="On Mission">
                          🚀
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedCharacter && (
                <div className="character-detail">
                  <div className="character-header">
                    <div className="character-portrait">
                      <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(selectedCharacter.characterClass) }}></div>
                    </div>
                    <div className="character-info">
                      <h3>{selectedCharacter.name}</h3>
                      <p>Level: {selectedCharacter.level}</p>
                      <p>Class: {formatClassName(selectedCharacter.characterClass)}</p>
                      <p>Specialty: {formatGameStrength(selectedCharacter.gameStrength)}</p>
                      <div className="character-stats">
                        <div className="stat"><span>STR</span> {Math.floor(selectedCharacter.strength)}</div>
                        <div className="stat"><span>AGI</span> {Math.floor(selectedCharacter.agility)}</div>
                        <div className="stat"><span>INT</span> {Math.floor(selectedCharacter.intelligence)}</div>
                        <div className="stat"><span>CHA</span> {Math.floor(selectedCharacter.charisma)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Skill Training Panel */}
                  <SkillTrainingPanel 
                    character={selectedCharacter} 
                    onSelectSkill={(skillType) => handleSelectSkill(selectedCharacter.id, skillType)} 
                    isOnMission={gameEngineRef.current?.isCharacterOnMission(selectedCharacter.id) || false}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="right-column">
            <div className="team-overview">
              <h2>Team Overview</h2>
              <div className="team-stats">
                <div className="team-stat">
                  <span className="label">Team Size:</span>
                  <span className="value">{gameState.activeCharacters.length} / {gameState.unlockedCharacters.length}</span>
                </div>
                <div className="team-stat">
                  <span className="label">Team Synergy:</span>
                  <span className="value">{gameState.teamSynergy}%</span>
                </div>
                <div className="team-stat">
                  <span className="label">Game Time:</span>
                  <span className="value">{Math.floor(gameState.gameTime / 60)} min</span>
                </div>
              </div>
              
              {renderActiveMissions()}
              
              <div className="game-stats">
                <h3>Game Statistics</h3>
                <div className="stat-grid">
                  <div className="game-stat">
                    <span className="label">Characters Unlocked:</span>
                    <span className="value">{gameState.unlockedCharacters.length} / {gameState.characters.length}</span>
                  </div>
                  <div className="game-stat">
                    <span className="label">Resource Rate:</span>
                    <span className="value">+{Math.floor(calculateTotalResourceRate(gameState))} / min</span>
                  </div>
                  {gameState.missions.length > 0 && (
                    <div className="game-stat">
                      <span className="label">Available Missions:</span>
                      <span className="value">{gameState.missions.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Tab */}
      {activeTab === UITab.SHOP && (
        <div className="shop-tab">
          <h2>Character Shop</h2>
          <p>Unlock new heroes to join your team using gold and data points!</p>
          
          <div className="shop-characters-grid">
            {gameState.characters
              .filter((character: Character) => 
                !gameState.unlockedCharacters.includes(character.id)
              )
              .map((character: Character) => {
                // Character prices based on their stats
                const goldPrice = Math.floor(100 * (character.strength + character.agility));
                const dataPrice = Math.floor(50 * (character.intelligence + character.charisma));
                
                return (
                  <div key={character.id} className="shop-character-card">
                    <div className="shop-character-header">
                      <h3>{character.name}</h3>
                      <div className="character-image">
                        <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(character.characterClass) }}></div>
                      </div>
                    </div>
                    <div className="shop-character-details">
                      <p><strong>Class:</strong> {formatClassName(character.characterClass)}</p>
                      <p><strong>Specialty:</strong> {formatGameStrength(character.gameStrength)}</p>
                      <div className="character-stats-small">
                        <div className="stat-small"><span>STR</span> {Math.floor(character.strength)}</div>
                        <div className="stat-small"><span>AGI</span> {Math.floor(character.agility)}</div>
                        <div className="stat-small"><span>INT</span> {Math.floor(character.intelligence)}</div>
                        <div className="stat-small"><span>CHA</span> {Math.floor(character.charisma)}</div>
                      </div>
                      <p className="character-background-small">{character.background}</p>
                      <div className="character-price">
                        <span>{goldPrice} Gold</span>
                        <span>{dataPrice} Data Points</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (gameEngineRef.current?.purchaseCharacter(character.id, goldPrice, dataPrice)) {
                            // Successful purchase is handled by the engine
                          }
                        }}
                        disabled={gameState.resources.gold < goldPrice || gameState.resources.dataPoints < dataPrice}
                        className="purchase-button"
                      >
                        {gameState.resources.gold < goldPrice || gameState.resources.dataPoints < dataPrice
                          ? "Not Enough Resources"
                          : `Unlock ${character.name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Missions Tab */}
      {activeTab === UITab.MISSIONS && (
        <div className="missions-content">
          <div className="missions-header">
            <h2>Missions</h2>
            <p>Send your team on missions to gain rewards and discover new heroes!</p>
          </div>
          
          {/* Render active missions section */}
          {renderActiveMissions()}
          
          <div className="available-missions">
            <h3>Available Missions</h3>
            {renderAvailableMissions()}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get color based on character class for placeholders
const getColorForCharacter = (characterClass: string): string => {
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
const calculateTotalResourceRate = (gameState: GameState): number => {
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

export default GameContainer; 