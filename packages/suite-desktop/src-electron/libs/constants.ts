import path from 'path';
import isDev from 'electron-is-dev';

export const PROTOCOL = 'file';

export const RESOURCES = isDev
    ? path.join(__dirname, '..', 'public', 'static')
    : process.resourcesPath;
