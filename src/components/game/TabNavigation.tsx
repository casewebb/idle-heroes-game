import React from 'react';

// Enum for UI tabs
export enum UITab {
  GAME = "game",
  SHOP = "shop",
  MISSIONS = "missions"
}

interface TabNavigationProps {
  activeTab: UITab;
  onSelectTab: (tab: UITab) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onSelectTab
}) => {
  return (
    <div className="tab-navigation">
      <button 
        className={activeTab === UITab.GAME ? "active" : ""}
        onClick={() => onSelectTab(UITab.GAME)}
      >
        Game
      </button>
      <button 
        className={activeTab === UITab.SHOP ? "active" : ""}
        onClick={() => onSelectTab(UITab.SHOP)}
      >
        Character Shop
      </button>
      <button 
        className={activeTab === UITab.MISSIONS ? "active" : ""}
        onClick={() => onSelectTab(UITab.MISSIONS)}
      >
        Missions
      </button>
    </div>
  );
};

export default TabNavigation; 