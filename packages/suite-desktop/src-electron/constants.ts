import isDev from 'electron-is-dev';

export const RESOURCES = isDev ? './public/static' : process.resourcesPath;
