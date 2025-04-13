import React, { useState, useEffect, useRef } from 'react';
import { Character, SkillType, CharacterSkill } from '../../types/Character';

interface SkillTrainingPanelProps {
  character: Character;
  onSelectSkill: (skillType: SkillType | null) => void;
  isOnMission: boolean;
}

interface RealTimeSkill extends CharacterSkill {
  realTimeExperience: number;
}

const SkillTrainingPanel: React.FC<SkillTrainingPanelProps> = ({ 
  character, 
  onSelectSkill, 
  isOnMission 
}) => {
  // Create a state for real-time skill data
  const [realTimeSkills, setRealTimeSkills] = useState<RealTimeSkill[]>([]);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  
  // Initialize real-time skills when character changes
  useEffect(() => {
    setRealTimeSkills(
      character.skills.map(skill => ({
        ...skill,
        realTimeExperience: skill.experience
      }))
    );
  }, [character.id, character.skills.map(s => `${s.type}-${s.level}-${s.experience}`).join(',')]);
  
  // Animation loop for real-time updates
  const animateSkills = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }
    
    // Calculate time delta in seconds
    const deltaTime = (time - previousTimeRef.current) / 1000;
    previousTimeRef.current = time;
    
    // Only update if character is actively training and not on mission
    if (character.currentlyTraining && !isOnMission) {
      setRealTimeSkills(prevSkills => {
        return prevSkills.map(skill => {
          // Only update the skill that's currently being trained
          if (skill.type === character.currentlyTraining && skill.level < skill.maxLevel) {
            // Calculate real-time experience gain based on training rate
            const expGain = skill.trainingRate * deltaTime;
            const newExp = skill.realTimeExperience + expGain;
            
            // Ensure we don't exceed the next level threshold
            const cappedExp = Math.min(newExp, skill.experienceToNextLevel);
            
            return {
              ...skill,
              realTimeExperience: cappedExp
            };
          }
          return skill;
        });
      });
    }
    
    requestRef.current = requestAnimationFrame(animateSkills);
  };
  
  // Set up and clean up animation frame
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateSkills);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [character.currentlyTraining, isOnMission]);
  
  // Get a real-time skill by type
  const getRealTimeSkill = (skillType: SkillType): RealTimeSkill | undefined => {
    return realTimeSkills.find(s => s.type === skillType);
  };
  
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
        {character.skills.map(skill => {
          // Get real-time skill data if available
          const realTimeSkill = getRealTimeSkill(skill.type);
          const displayExperience = realTimeSkill ? realTimeSkill.realTimeExperience : skill.experience;
          
          const progressPercentage = (displayExperience / skill.experienceToNextLevel) * 100;
          
          return (
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
                    style={{
                      width: `${progressPercentage}%`,
                      transition: character.currentlyTraining === skill.type ? 'none' : 'width 0.3s ease'
                    }}
                  ></div>
                </div>
                <span>{Math.floor(displayExperience)} / {skill.experienceToNextLevel} XP</span>
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
          );
        })}
      </div>
    </div>
  );
};

export default SkillTrainingPanel; 