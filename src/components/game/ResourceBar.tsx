import React from 'react';
import { Resources } from '../../types/Character';

interface ResourceBarProps {
  resources: Resources;
  onSaveGame: () => void;
  onResetGame: () => void;
  lastSaveTime: number;
  showSaveIndicator: boolean;
}

const ResourceBar: React.FC<ResourceBarProps> = ({ 
  resources, 
  onSaveGame, 
  onResetGame, 
  lastSaveTime, 
  showSaveIndicator 
}) => {
  return (
    <div className="resource-bar">
      <div className="resource">
        <div>Gold:</div><span>{Math.floor(resources.gold)}</span>
      </div>
      <div className="resource">
        <div>Data Points:</div><span>{Math.floor(resources.dataPoints)}</span>
      </div>
      <div className="resource">
        <div>Team Morale:</div><span>{Math.floor(resources.teamMorale)}</span>
      </div>
      <div className="resource">
        <div>Adaptation Tokens:</div><span>{Math.floor(resources.adaptationTokens)}</span>
      </div>
      <div className="game-actions">
        {showSaveIndicator && (
          <div className="save-indicator">Game Saved!</div>
        )}
        <button 
          className="save-button" 
          onClick={onSaveGame} 
          title="Save your game now"
        >
          Save Game
        </button>
        <button 
          className="reset-button" 
          onClick={onResetGame} 
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
  );
};

export default ResourceBar; 