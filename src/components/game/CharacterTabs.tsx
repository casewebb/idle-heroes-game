import React from 'react';
import { Character } from '../../types/Character';
import { calculateXpForNextLevel, formatGameStrength } from './utils';

interface CharacterTabsProps {
  characters: Character[];
  selectedCharacterId: string;
  onSelectCharacter: (characterId: string) => void;
  isCharacterOnMission: (characterId: string) => boolean;
}

const CharacterTabs: React.FC<CharacterTabsProps> = ({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  isCharacterOnMission
}) => {
  return (
    <div className="character-tabs">
      {characters.map((character: Character) => (
        <div 
          key={character.id} 
          className={`character-tab ${character.id === selectedCharacterId ? 'active' : ''} ${isCharacterOnMission(character.id) ? 'on-mission' : ''}`}
          onClick={() => onSelectCharacter(character.id)}
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
            {isCharacterOnMission(character.id) && (
              <div className="mission-indicator" title="On Mission">
                🚀
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CharacterTabs; 