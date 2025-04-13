import React from 'react';
import { GameState, Mission } from '../../types/Character';
import ActiveMissionCard from './ActiveMissionCard';
import MissionCard from './MissionCard';

interface MissionsTabProps {
  gameState: GameState;
  onBeginMission: (missionId: string) => void;
}

const MissionsTab: React.FC<MissionsTabProps> = ({
  gameState,
  onBeginMission
}) => {
  return (
    <div className="missions-content">
      <div className="missions-header">
        <h2>Missions</h2>
        <p>Send your team on missions to gain rewards and discover new heroes!</p>
      </div>
      
      {/* Active Missions */}
      {gameState.currentMissions.length > 0 ? (
        <div className="active-missions">
          <h3>Active Missions</h3>
          <div className="active-missions-grid">
            {gameState.currentMissions.map((mission: Mission) => (
              <ActiveMissionCard 
                key={mission.id}
                mission={mission}
                characters={gameState.characters}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="no-active-missions">
          <p>You don't have any active missions at the moment.</p>
          <p>Select a mission from the available missions to get started!</p>
        </div>
      )}
      
      {/* Available Missions */}
      <div className="available-missions">
        <h3>Available Missions</h3>
        {gameState.missions.length > 0 ? (
          <div className="mission-grid">
            {gameState.missions.map((mission: Mission) => (
              <MissionCard 
                key={mission.id}
                mission={mission}
                onBeginMission={onBeginMission}
              />
            ))}
          </div>
        ) : (
          <p>No missions available at the moment. Check back later!</p>
        )}
      </div>
    </div>
  );
};

export default MissionsTab; 