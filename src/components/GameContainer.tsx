import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { GameState, Character, Mission, SkillType } from '../types/Character';
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

import { checkForSavedGame } from './game/utils';

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
        />
      )}
    </div>
  );
};

export default GameContainer; 