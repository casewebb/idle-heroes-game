import React from 'react';
import { Character, GameState, Mission, SkillType } from '../../types/Character';
import CharacterTabs from './CharacterTabs';
import CharacterDetail from './CharacterDetail';
import ActiveMissionCard from './ActiveMissionCard';
import { calculateTotalResourceRate } from './utils';

interface GameTabProps {
  gameState: GameState;
  selectedCharacterId: string | null;
  onSelectCharacter: (characterId: string) => void;
  onSelectSkill: (characterId: string, skillType: SkillType | null) => void;
  isCharacterOnMission: (characterId: string) => boolean;
}

const GameTab: React.FC<GameTabProps> = ({
  gameState,
  selectedCharacterId,
  onSelectCharacter,
  onSelectSkill,
  isCharacterOnMission
}) => {
  // Default to the first active character if none is selected
  const effectiveSelectedCharId = selectedCharacterId || gameState.activeCharacters[0]?.id;
  const selectedCharacter = gameState.activeCharacters.find(c => c.id === effectiveSelectedCharId);

  return (
    <div className="game-content">
      <div className="left-column">
        <div className="character-roster">
          <h2>Active Characters</h2>
          <CharacterTabs 
            characters={gameState.activeCharacters}
            selectedCharacterId={effectiveSelectedCharId || ''}
            onSelectCharacter={onSelectCharacter}
            isCharacterOnMission={isCharacterOnMission}
          />
          
          {selectedCharacter && (
            <CharacterDetail 
              character={selectedCharacter}
              onSelectSkill={(skillType) => onSelectSkill(selectedCharacter.id, skillType)}
              isOnMission={isCharacterOnMission(selectedCharacter.id)}
            />
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
          
          {/* Active Missions */}
          {gameState.currentMissions.length > 0 ? (
            <div className="active-missions">
              <h3>Active Missions</h3>
              <div className="active-missions-grid">
                {gameState.currentMissions.map((mission: Mission) => (
                  <ActiveMissionCard 
                    key={mission.id}
                    mission={mission}
                    characters={gameState.characters}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="no-active-missions">
              <p>You don't have any active missions at the moment.</p>
              <p>Select a mission from the available missions to get started!</p>
            </div>
          )}
          
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
  );
};

export default GameTab; 