import path from 'path';

import type { Project } from './constants';

export const getPathForProject = (project: Project) => {
    const basePath = path.join(__dirname, '..', '..');

    switch (project) {
        case 'web':
            return path.join(basePath, 'suite-web');
        case 'desktop':
            return path.join(basePath, 'suite-desktop');
        default:
            return '';
    }
};
