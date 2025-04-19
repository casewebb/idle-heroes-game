import React from 'react';
import { GameState, Mission } from '../../types/Character';
import ActiveMissionCard from './ActiveMissionCard';
import MissionCard from './MissionCard';

interface MissionsTabProps {
  gameState: GameState;
  onBeginMission: (missionId: string) => void;
  onToggleAutoMission: () => void;
  canEnableAutoMission: boolean;
}

const MissionsTab: React.FC<MissionsTabProps> = ({
  gameState,
  onBeginMission,
  onToggleAutoMission,
  canEnableAutoMission
}) => {
  return (
    <div className="missions-content">
      <div className="missions-header">
        <h2>Missions</h2>
        <p>Send your team on missions to gain rewards and discover new heroes!</p>
        
        {canEnableAutoMission && (
          <div className="auto-mission-toggle">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={gameState.autoMission}
                onChange={onToggleAutoMission}
              />
              <span className="toggle-label">Auto-continue missions</span>
              <span className="tooltip">
                When enabled, your team will automatically continue with new missions after completion.
                You can disable this at any time by unchecking this box.
              </span>
            </label>
            {gameState.autoMission && (
              <div className="auto-mission-active">
                <div className="auto-mission-indicator">Auto-mission enabled</div>
                <p className="auto-mission-note">Your team will automatically continue missions. 
                Uncheck the box above to disable.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Active Missions */}
      {gameState.currentMissions.length > 0 ? (
        <div className="active-missions">
          <h3>Active Missions</h3>
          <div className="active-missions-grid">
            {gameState.currentMissions.map((mission: Mission, index: number) => (
              <ActiveMissionCard 
                key={`missions_tab_${mission.id}`}
                mission={mission}
                characters={gameState.characters}
                missionIndex={index}
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
            {gameState.missions.map((mission: Mission, index: number) => (
              <MissionCard 
                key={`available_mission_index_${index}`}
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