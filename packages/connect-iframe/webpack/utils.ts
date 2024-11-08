import path from 'path';

type Project = 'iframe' | 'suite-web';

export const getDistPathForProject = (project: Project = 'iframe') => {
    const basePath = path.join(__dirname, '..', '..');
    switch (project) {
        case 'iframe':
            return path.join(basePath, 'connect-iframe', 'build');
        case 'suite-web':
            return path.join(basePath, 'suite-web', 'build');
        default:
            throw new Error('Missing project.');
    }
};

// TODO: maybe sharedworker is not needed anymore.
export const getSharedworkerDistPathForProject = (project: Project = 'iframe') => {
    const basePath = path.join(__dirname, '..', '..');
    switch (project) {
        case 'iframe':
            return path.join(basePath, 'connect-iframe', 'build');
        case 'suite-web':
            return path.join(basePath, 'suite-web', 'build');
        default:
            throw new Error('Missing project.');
    }
};
