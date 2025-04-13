import React from 'react';
import { Character, SkillType } from '../../types/Character';

interface SkillTrainingPanelProps {
  character: Character;
  onSelectSkill: (skillType: SkillType | null) => void;
  isOnMission: boolean;
}

const SkillTrainingPanel: React.FC<SkillTrainingPanelProps> = ({ 
  character, 
  onSelectSkill, 
  isOnMission 
}) => {
  return (
    <div className="skill-training-panel">
      <h3>Training</h3>
      
      {isOnMission ? (
        <div className="mission-training-notice">
          <p>This character is currently on a mission and cannot train skills until they return.</p>
        </div>
      ) : character.currentlyTraining ? (
        <div className="current-training">
          <p>
            Currently training: <strong>{character.skills.find(s => s.type === character.currentlyTraining)?.name}</strong>
          </p>
          <button onClick={() => onSelectSkill(null)}>Stop Training</button>
        </div>
      ) : (
        <p>Not currently training any skills</p>
      )}
      
      <div className="skills-list">
        <h4>Available Skills</h4>
        {character.skills.map(skill => (
          <div key={skill.type} className="skill-item">
            <div className="skill-header">
              <h5>{skill.name}</h5>
              <div className="skill-level">Level {skill.level}</div>
            </div>
            <p>{skill.description}</p>
            <div className="skill-progress">
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{width: `${(skill.experience / skill.experienceToNextLevel) * 100}%`}}
                ></div>
              </div>
              <span>{Math.floor(skill.experience)} / {skill.experienceToNextLevel} XP</span>
            </div>
            <div className="skill-bonuses">
              {skill.bonuses.strength ? <span>+{Math.round(skill.bonuses.strength * skill.level * 10) / 10} STR</span> : null}
              {skill.bonuses.agility ? <span>+{Math.round(skill.bonuses.agility * skill.level * 10) / 10} AGI</span> : null}
              {skill.bonuses.intelligence ? <span>+{Math.round(skill.bonuses.intelligence * skill.level * 10) / 10} INT</span> : null}
              {skill.bonuses.charisma ? <span>+{Math.round(skill.bonuses.charisma * skill.level * 10) / 10} CHA</span> : null}
              {skill.bonuses.resourceGain ? <span>+{Math.floor(skill.bonuses.resourceGain * skill.level * 100)}% Resources</span> : null}
              {skill.bonuses.missionSpeed ? <span>+{Math.floor(skill.bonuses.missionSpeed * skill.level * 100)}% Mission Speed</span> : null}
              {skill.bonuses.abilityEffectiveness ? <span>+{Math.floor(skill.bonuses.abilityEffectiveness * skill.level * 100)}% Ability Effect</span> : null}
            </div>
            <button 
              onClick={() => onSelectSkill(skill.type)}
              disabled={character.currentlyTraining === skill.type || skill.level >= skill.maxLevel || isOnMission}
              className={skill.level >= skill.maxLevel ? "max-level" : isOnMission ? "disabled" : ""}
            >
              {skill.level >= skill.maxLevel ? "Max Level" : 
                character.currentlyTraining === skill.type ? "Training" : "Train"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillTrainingPanel; 