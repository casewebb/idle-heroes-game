import React from 'react';
import { Mission, Character, GameStrength } from '../../types/Character';
import { formatGameStrength, getColorForCharacter, formatClassName } from './utils';

interface MissionSelectionDialogProps {
  mission: Mission;
  availableCharacters: Character[];
  selectedCharacterIds: string[];
  onToggleCharacter: (characterId: string) => void;
  onStartMission: () => void;
  onCancel: () => void;
  isCharacterOnMission: (characterId: string) => boolean;
}

const MissionSelectionDialog: React.FC<MissionSelectionDialogProps> = ({
  mission,
  availableCharacters,
  selectedCharacterIds,
  onToggleCharacter,
  onStartMission,
  onCancel,
  isCharacterOnMission
}) => {
  // Check if requirements are met with current selection
  const areMissionRequirementsMet = (): boolean => {
    // Check if the selected characters cover all required strengths
    return mission.requiredStrengths.every(requiredStrength => 
      selectedCharacterIds.some(charId => {
        const char = availableCharacters.find(c => c.id === charId);
        return char && char.gameStrength === requiredStrength;
      })
    );
  };

  const requirementsMet = areMissionRequirementsMet();

  return (
    <div className="popup-overlay">
      <div className="mission-selection-popup">
        <div className="popup-header">
          <h2>Select Characters for Mission</h2>
          <button className="close-button" onClick={onCancel}>×</button>
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
                    selectedCharacterIds.some(charId => {
                      const char = availableCharacters.find(c => c.id === charId);
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
                const isOnMission = isCharacterOnMission(character.id);
                
                return (
                  <div 
                    key={character.id}
                    className={`mission-character-option 
                      ${selectedCharacterIds.includes(character.id) ? 'selected' : ''}
                      ${mission.requiredStrengths.includes(character.gameStrength) ? 'strength-match' : ''}
                      ${isOnMission ? 'on-mission-disabled' : ''}
                    `}
                    onClick={() => !isOnMission && onToggleCharacter(character.id)}
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
                      {selectedCharacterIds.includes(character.id) ? '✓' : 
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
            onClick={onStartMission}
            disabled={selectedCharacterIds.length === 0 || !requirementsMet}
          >
            {!requirementsMet ? 'Mission Requirements Not Met' : 'Start Mission'}
          </button>
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionSelectionDialog; 