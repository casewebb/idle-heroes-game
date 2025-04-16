import React from 'react';
import { Mission, Character } from '../../types/Character';
import { getColorForCharacter } from './utils';

interface ActiveMissionCardProps {
  mission: Mission;
  characters: Character[];
}

const ActiveMissionCard: React.FC<ActiveMissionCardProps> = ({
  mission,
  characters
}) => {
  const assignedCharacters = mission.assignedCharacters
    .map(id => characters.find(c => c.id === id))
    .filter(Boolean) as Character[];
  
  return (
    <div className="active-mission-card">
      <div className="mission-header">
        <h4>{mission.name}</h4>
        <div className="mission-progress-display">
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{width: `${mission.completionProgress}%`}}
            ></div>
          </div>
          <span>{Math.floor(mission.completionProgress)}%</span>
        </div>
      </div>
      
      <p className="mission-description">{mission.description}</p>
      
      <div className="mission-details-grid">
        <div className="mission-team">
          <h5>Team:</h5>
          <div className="mission-team-members">
            {assignedCharacters.map((char) => (
              <div key={char.id} className="team-member">
                <div className="placeholder-image" style={{ 
                  backgroundColor: getColorForCharacter(char.characterClass),
                  width: '20px',
                  height: '20px'
                }}></div>
                <span>{char.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mission-rewards">
          <h5>Rewards:</h5>
          <div className="rewards-list">
            {mission.rewards.gold > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.gold}</span> Gold</div>}
            {mission.rewards.dataPoints > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.dataPoints}</span> Data</div>}
            {mission.rewards.teamMorale > 0 && <div className="reward-item"><span className="reward-value">+{mission.rewards.teamMorale}</span> Morale</div>}
            {mission.rewards.adaptationTokens > 0 && <div className="reward-item"><span className="reward-value">{mission.rewards.adaptationTokens}</span> Tokens</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveMissionCard; 