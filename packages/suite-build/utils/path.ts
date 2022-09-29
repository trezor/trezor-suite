import path from 'path';

export const getPathForProject = (project: 'web' | 'desktop' | 'desktop-ui') => {
    const basePath = path.join(__dirname, '..', '..');

    switch (project) {
        case 'web':
            return path.join(basePath, 'suite-web');
        case 'desktop-ui':
            return path.join(basePath, 'suite-desktop-ui');
        case 'desktop':
            return path.join(basePath, 'suite-desktop');
        default:
            return '';
    }
};
