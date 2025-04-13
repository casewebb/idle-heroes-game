import React from 'react';
import { Character } from '../../types/Character';
import { formatClassName, formatGameStrength, getColorForCharacter } from './utils';

interface ShopCharacterCardProps {
  character: Character;
  goldPrice: number;
  dataPrice: number;
  onPurchase: (characterId: string, goldPrice: number, dataPrice: number) => void;
  canAfford: boolean;
}

const ShopCharacterCard: React.FC<ShopCharacterCardProps> = ({
  character,
  goldPrice,
  dataPrice,
  onPurchase,
  canAfford
}) => {
  return (
    <div className="shop-character-card">
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
          onClick={() => onPurchase(character.id, goldPrice, dataPrice)}
          disabled={!canAfford}
          className="purchase-button"
        >
          {!canAfford
            ? "Not Enough Resources"
            : `Unlock ${character.name}`}
        </button>
      </div>
    </div>
  );
};

export default ShopCharacterCard; 