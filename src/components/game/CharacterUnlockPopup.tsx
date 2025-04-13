import React from 'react';
import { Character } from '../../types/Character';
import { formatClassName, formatGameStrength, getColorForCharacter } from './utils';

interface CharacterUnlockPopupProps {
  character: Character;
  onClose: () => void;
}

const CharacterUnlockPopup: React.FC<CharacterUnlockPopupProps> = ({
  character,
  onClose
}) => {
  return (
    <div className="popup-overlay">
      <div className="character-unlock-popup">
        <div className="popup-header">
          <h2>New Character Unlocked!</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="popup-content">
          <div className="unlock-character-portrait">
            <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(character.characterClass) }}></div>
          </div>
          <div className="unlock-character-info">
            <h3>{character.name}</h3>
            <p><strong>Class:</strong> {formatClassName(character.characterClass)}</p>
            <p><strong>Specialty:</strong> {formatGameStrength(character.gameStrength)}</p>
            <div className="unlock-character-stats">
              <div className="stat-small"><span>STR</span> {Math.floor(character.strength)}</div>
              <div className="stat-small"><span>AGI</span> {Math.floor(character.agility)}</div>
              <div className="stat-small"><span>INT</span> {Math.floor(character.intelligence)}</div>
              <div className="stat-small"><span>CHA</span> {Math.floor(character.charisma)}</div>
            </div>
            <p className="unlock-character-background">{character.background}</p>
            <p className="character-added-notice">This character has been automatically added to your team!</p>
          </div>
        </div>
        <div className="popup-actions">
          <button 
            className="close-button-large"
            onClick={onClose}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterUnlockPopup; 