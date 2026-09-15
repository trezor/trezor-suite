import path from 'path';

export const getPathForProject = (project: 'web' | 'desktop' | 'desktop-ui') => {
    // suite-build still lives in packages/ until it is dismantled; the apps it builds
    // have already moved to suite/.
    const basePath = path.join(__dirname, '..', '..', '..', 'suite');

    switch (project) {
        case 'web':
            return path.join(basePath, 'web-app');
        case 'desktop-ui':
            return path.join(basePath, 'desktop-app-renderer');
        case 'desktop':
            return path.join(basePath, 'desktop-app');
        default:
            return '';
    }
};
