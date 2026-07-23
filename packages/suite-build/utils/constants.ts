export const PROJECTS = ['web', 'desktop', 'tauri'] as const;
export type Project = (typeof PROJECTS)[number];

export const DEV_PORTS: { [key in Project]: number } = {
    web: 8000,
    desktop: 8000,
    tauri: 8000,
};
