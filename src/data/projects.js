import content from './content.json' with { type: 'json' };

// This order controls the full list and the next-project links.
export const projectOrder = ["PureSpirit","SignLanguage","Lathe","MillingMachine","SeaWar","AlienBubble","ArduinoShoot","GloriousBottle","SaveLunch"];
export const projects = projectOrder.map(id => content.projects[id]);
export const projectGroups = [
  { id: 'Special', name: '計畫與畢業專題' },
  { id: 'Junior', name: '大三課程實作', description: '以下是大三期間配合課程完成的實作，主要用來練習 VR、資料庫串接與硬體互動。' },
  { id: 'Sophomore', name: '大二課程實作', description: '以下是大二期間配合課程完成的實作，主要用來練習遊戲功能與團隊製作流程。' },
];
export const featuredIds = projectOrder.slice(0, 3);

export function getProject(id) {
  return projects.find(project => project.id === id);
}

export function projectsInGroup(id) {
  return projects.filter(project => project.group === id);
}

export function nextProject(id) {
  const index = projects.findIndex(project => project.id === id);
  return index < 0 ? undefined : projects[(index + 1) % projects.length];
}

export const featuredProjects = featuredIds.map(getProject);
export const otherProjects = projects.filter(project => !featuredIds.includes(project.id));
