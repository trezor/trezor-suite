import path from 'path';

export const ABSOLUTE_BASE = path.normalize(path.join(__dirname, '..'));

const constants = Object.freeze({
    BUILD: path.join(ABSOLUTE_BASE, 'build/'),
    SRC: path.join(ABSOLUTE_BASE, 'src/'),
    PORT: 8089,
    INDEX: path.join(ABSOLUTE_BASE, 'src/index.html'),
});

export const { BUILD, SRC, PORT, INDEX } = constants;
