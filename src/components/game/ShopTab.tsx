import React from 'react';
import { Character, GameState } from '../../types/Character';
import ShopCharacterCard from './ShopCharacterCard';

interface ShopTabProps {
  gameState: GameState;
  onPurchaseCharacter: (characterId: string, goldPrice: number, dataPrice: number) => void;
}

const ShopTab: React.FC<ShopTabProps> = ({
  gameState,
  onPurchaseCharacter
}) => {
  // Filter to only show characters that haven't been unlocked yet
  const availableCharacters = gameState.characters.filter(
    (character: Character) => !gameState.unlockedCharacters.includes(character.id)
  );

  return (
    <div className="shop-tab">
      <h2>Character Shop</h2>
      <p>Unlock new heroes to join your team using gold and data points!</p>
      
      <div className="shop-characters-grid">
        {availableCharacters.map((character: Character) => {
          // Character prices based on their stats
          const goldPrice = Math.floor(100 * (character.strength + character.agility));
          const dataPrice = Math.floor(50 * (character.intelligence + character.charisma));
          
          // Check if player can afford this character
          const canAfford = gameState.resources.gold >= goldPrice && 
                          gameState.resources.dataPoints >= dataPrice;
          
          return (
            <ShopCharacterCard
              key={character.id}
              character={character}
              goldPrice={goldPrice}
              dataPrice={dataPrice}
              onPurchase={onPurchaseCharacter}
              canAfford={canAfford}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ShopTab; 