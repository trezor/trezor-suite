export const PROJECTS = ['web', 'desktop'] as const;
export type Project = typeof PROJECTS[number];

export const DEV_PORTS: { [key in Project]: number } = {
    web: 8000,
    desktop: 8000,
};
