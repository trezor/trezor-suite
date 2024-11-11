import path from 'path';

type Project = 'iframe' | 'popup' | 'suite-web';

export const getDistPathForProject = (project: Project = 'iframe') => {
    const basePath = path.join(__dirname, '..', '..');
    switch (project) {
        case 'iframe':
            return path.join(basePath, 'connect-iframe', 'build');
        case 'suite-web':
            return path.join(basePath, 'suite-web', 'build');
        case 'popup':
            return path.join(basePath, 'connect-popup', 'build');
        default:
            throw new Error('Missing project.');
    }
};
