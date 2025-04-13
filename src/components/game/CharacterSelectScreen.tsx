import React from 'react';
import { Character } from '../../types/Character';
import { formatClassName, formatGameStrength, getColorForCharacter } from './utils';

interface CharacterSelectScreenProps {
  characters: Character[];
  hasSavedGame: boolean;
  onCharacterSelect: (characterId: string) => void;
  onContinueGame: () => void;
  onClearStorage: () => void;
  onStartNewGame: () => void;
}

const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  characters,
  hasSavedGame,
  onCharacterSelect,
  onContinueGame,
  onClearStorage,
  onStartNewGame
}) => {
  return (
    <div className="character-select-container">
      <h1>Idle Heroes: Guild of Unlikely Heroes</h1>
      
      {hasSavedGame && (
        <div className="saved-game-banner">
          <h2>Welcome Back!</h2>
          <p>We found a saved game. Would you like to continue where you left off?</p>
          <div className="saved-game-actions">
            <button className="continue-button" onClick={onContinueGame}>
              Continue Game
            </button>
            <button className="new-game-button" onClick={onStartNewGame}>
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
            onClick={onClearStorage}
            style={{ marginBottom: "20px" }}
          >
            Clear Saved Data
          </button>
          
          <div className="character-selection">
            {characters.map((character) => (
              <div key={character.id} className="character-select-card">
                <h2>{character.name}</h2>
                <div className="character-image">
                  {/* You can add character images here */}
                  <div className="placeholder-image" style={{ backgroundColor: getColorForCharacter(character.characterClass) }}></div>
                </div>
                <p><strong>Class:</strong> {formatClassName(character.characterClass)}</p>
                <p><strong>Specialty:</strong> {formatGameStrength(character.gameStrength)}</p>
                <p className="character-background">{character.background}</p>
                <button onClick={() => onCharacterSelect(character.id)}>
                  Select {character.name}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CharacterSelectScreen; 