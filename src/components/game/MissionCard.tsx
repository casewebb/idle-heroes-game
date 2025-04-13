import React from 'react';
import { Mission } from '../../types/Character';
import { formatGameStrength } from './utils';

interface MissionCardProps {
  mission: Mission;
  onBeginMission: (missionId: string) => void;
}

const MissionCard: React.FC<MissionCardProps> = ({
  mission,
  onBeginMission
}) => {
  return (
    <div className="mission-card">
      <div className="mission-card-header">
        <h4>{mission.name}</h4>
        <div className="mission-difficulty">
          <strong>Difficulty:</strong> {mission.difficulty.toFixed(1)}
        </div>
      </div>
      <p className="mission-description">{mission.description}</p>
      
      <div className="mission-card-details">
        <div className="mission-requirements">
          <h5>Required Strengths:</h5>
          <div className="required-strengths">
            {mission.requiredStrengths.map((strength, index) => (
              <div key={index} className="strength-tag">
                {formatGameStrength(strength)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mission-rewards-compact">
          <h5>Rewards:</h5>
          <div className="rewards-grid">
            {mission.rewards.gold > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.gold}</span> Gold</div>}
            {mission.rewards.dataPoints > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.dataPoints}</span> Data</div>}
            {mission.rewards.teamMorale > 0 && <div className="reward-item"><span className="reward-value">+{mission.rewards.teamMorale}</span> Morale</div>}
            {mission.rewards.adaptationTokens > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.adaptationTokens}</span> Tokens</div>}
          </div>
        </div>
      </div>
      
      <button 
        className="begin-mission-button"
        onClick={() => onBeginMission(mission.id)}
      >
        Begin Mission
      </button>
    </div>
  );
};

export default MissionCard; 