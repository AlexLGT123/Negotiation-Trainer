
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000];
export const LEVEL_TITLES_EN = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 'Grandmaster', 'Legend'];
export const LEVEL_TITLES_FR = ['Novice', 'Apprenti(e)', 'Adepte', 'Expert(e)', 'Maître', 'Grand Maître', 'Légende'];

export const getLevelFromXp = (xp: number): { level: number; progress: number } => {
    let level = 1;
    while (level < LEVEL_THRESHOLDS.length && xp >= LEVEL_THRESHOLDS[level]) {
        level++;
    }
    
    const currentLevelXpThreshold = LEVEL_THRESHOLDS[level - 1];
    const nextLevelXpThreshold = LEVEL_THRESHOLDS[level] ?? (currentLevelXpThreshold * 2);

    const xpInCurrentLevel = xp - currentLevelXpThreshold;
    const xpForNextLevel = nextLevelXpThreshold - currentLevelXpThreshold;

    const progress = xpForNextLevel === 0 ? 100 : Math.min(100, Math.round((xpInCurrentLevel / xpForNextLevel) * 100));

    return {
        level,
        progress
    };
};

export const getTitle = (level: number, language: 'en' | 'fr'): string => {
    const titles = language === 'fr' ? LEVEL_TITLES_FR : LEVEL_TITLES_EN;
    return titles[Math.min(level - 1, titles.length - 1)];
};
