import React from 'react';
import { Character, SkillType } from '../../types/Character';
import { formatClassName, formatGameStrength, getColorForCharacter } from './utils';
import SkillTrainingPanel from './SkillTrainingPanel';

interface CharacterDetailProps {
  character: Character;
  onSelectSkill: (skillType: SkillType | null) => void;
  isOnMission: boolean;
}

const CharacterDetail: React.FC<CharacterDetailProps> = ({
  character,
  onSelectSkill,
  isOnMission
}) => {
  return (
    <div className="character-detail">
      <div className="character-header">
        <div className="character-portrait">
          <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(character.characterClass) }}></div>
        </div>
        <div className="character-info">
          <h3>{character.name}</h3>
          <p>Level: {character.level}</p>
          <p>Class: {formatClassName(character.characterClass)}</p>
          <p>Specialty: {formatGameStrength(character.gameStrength)}</p>
          <div className="character-stats">
            <div className="stat"><span>STR</span> {Math.floor(character.strength)}</div>
            <div className="stat"><span>AGI</span> {Math.floor(character.agility)}</div>
            <div className="stat"><span>INT</span> {Math.floor(character.intelligence)}</div>
            <div className="stat"><span>CHA</span> {Math.floor(character.charisma)}</div>
          </div>
        </div>
      </div>
      
      {/* Skill Training Panel */}
      <SkillTrainingPanel 
        character={character} 
        onSelectSkill={onSelectSkill} 
        isOnMission={isOnMission}
      />
    </div>
  );
};

export default CharacterDetail; 